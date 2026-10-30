using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using sunsteel.api.Common.Exceptions;
using sunsteel.api.Common.Models;
using sunsteel.api.Common.Security;
using sunsteel.api.Data;
using sunsteel.api.Data.Entities;
using sunsteel.api.Features.Audit;
using sunsteel.api.Features.Site;

namespace sunsteel.api.Features.Content;

public sealed record AdminPageDto(long Id, string Slug, string Title, string? MetaTitle, string? MetaDescription);
public sealed record SavePageRequest(string? MetaTitle, string? MetaDescription);

public sealed record AdminFaqDto(string Question, string Answer, bool Visible);

public sealed record AdminPolicyDto(string Slug, string Title, string BodyHtml, DateTime UpdatedAt);
public sealed record SavePolicyRequest(string Title, string BodyHtml);

public sealed record AdminSiloDto(long Id, string Key, string Name, string? Intro, string? TopGrades, string? MetaTitle, string? MetaDescription, long? HeroMediaId, string? HeroUrl);
public sealed record SaveSiloRequest(string? Intro, string? TopGrades, string? MetaTitle, string? MetaDescription, long? HeroMediaId);

public sealed record AdminCityDto(long Id, string Slug, string Name, string? LeadTime, string? Zones, string? Intro, IReadOnlyList<string> Industries, string? MetaTitle, string? MetaDescription, bool IsPublished);
public sealed record SaveCityRequest(string? LeadTime, string? Zones, string? Intro, List<string>? Industries, string? MetaTitle, string? MetaDescription, bool IsPublished);

/// <summary>
/// Editors for the words on the public site: page SEO, FAQs (page / category / product), the two policy
/// pages, category intros and the city landing pages. Everything saved here evicts the public cache.
/// </summary>
[ApiController]
[Route("api/admin")]
public sealed class ContentAdminController : ControllerBase
{
    private static readonly string[] FaqScopes = ["page", "silo", "product"];
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly SunSteelDbContext _db;
    private readonly IAuditService _audit;
    private readonly IOutputCacheStore _cache;

    public ContentAdminController(SunSteelDbContext db, IAuditService audit, IOutputCacheStore cache)
    {
        _db = db;
        _audit = audit;
        _cache = cache;
    }

    // ---- pages (SEO) ----

    [HttpGet("pages")]
    [Authorize(Policy = Perm.CmsManage)]
    public async Task<IActionResult> Pages(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<AdminPageDto>>.Ok(await _db.Pages.AsNoTracking().OrderBy(p => p.PageId)
            .Select(p => new AdminPageDto(p.PageId, p.Slug, p.Title, p.MetaTitle, p.MetaDescription)).ToListAsync(ct)));

    [HttpPut("pages/{id:long}")]
    [Authorize(Policy = Perm.CmsManage)]
    public async Task<IActionResult> SavePage(long id, SavePageRequest r, CancellationToken ct)
    {
        var p = await _db.Pages.FirstOrDefaultAsync(x => x.PageId == id, ct) ?? throw new AppException("Page not found.", 404);
        p.MetaTitle = Clean(r.MetaTitle, 160);
        p.MetaDescription = Clean(r.MetaDescription, 320);
        _audit.Record(User.UserId(), "Update", "Page", p.Slug, p.Title);
        await _db.SaveChangesAsync(ct);
        await Evict(ct);
        return Ok(ApiResponse<AdminPageDto>.Ok(new AdminPageDto(p.PageId, p.Slug, p.Title, p.MetaTitle, p.MetaDescription), "Page saved."));
    }

    // ---- FAQs ----

    [HttpGet("faqs")]
    [Authorize(Policy = Perm.CmsManage)]
    public async Task<IActionResult> Faqs([FromQuery] string scope, [FromQuery] string key = "", CancellationToken ct = default)
    {
        CheckScope(scope);
        var rows = await _db.Faqs.AsNoTracking().Where(f => f.Scope == scope && f.ScopeKey == key)
            .OrderBy(f => f.DisplayOrder).ThenBy(f => f.FaqId).Select(f => new AdminFaqDto(f.Question, f.Answer, f.IsVisible)).ToListAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<AdminFaqDto>>.Ok(rows));
    }

    /// <summary>Replaces the whole list for one page / category / product. An empty list restores the built-in answers.</summary>
    [HttpPut("faqs")]
    [Authorize(Policy = Perm.CmsManage)]
    public async Task<IActionResult> SaveFaqs([FromQuery] string scope, [FromQuery] string key, List<AdminFaqDto> items, CancellationToken ct)
    {
        CheckScope(scope);
        key ??= "";
        if (items.Count > 30) throw new AppException("At most 30 questions per page.");
        foreach (var i in items)
        {
            if (string.IsNullOrWhiteSpace(i.Question) || string.IsNullOrWhiteSpace(i.Answer)) throw new AppException("Every question needs an answer.");
            if (i.Question.Length > 300) throw new AppException("A question is too long (limit 300 characters).");
            if (i.Answer.Length > 1500) throw new AppException("An answer is too long (limit 1500 characters).");
        }
        _db.Faqs.RemoveRange(await _db.Faqs.Where(f => f.Scope == scope && f.ScopeKey == key).ToListAsync(ct));
        var order = 0;
        foreach (var i in items)
            _db.Faqs.Add(new Faq { Scope = scope, ScopeKey = key, Question = i.Question.Trim(), Answer = i.Answer.Trim(), IsVisible = i.Visible, DisplayOrder = ++order });
        _audit.Record(User.UserId(), "Update", "Faqs", $"{scope}:{key}", $"{items.Count} questions");
        await _db.SaveChangesAsync(ct);
        await Evict(ct);
        return Ok(ApiResponse<IReadOnlyList<AdminFaqDto>>.Ok(items, "Questions saved."));
    }

    // ---- policies ----

    [HttpGet("policies")]
    [Authorize(Policy = Perm.CmsManage)]
    public async Task<IActionResult> Policies(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<AdminPolicyDto>>.Ok(await _db.PolicyPages.AsNoTracking().OrderBy(p => p.Slug)
            .Select(p => new AdminPolicyDto(p.Slug, p.Title, p.BodyHtml, p.UpdatedAt)).ToListAsync(ct)));

    [HttpPut("policies/{slug}")]
    [Authorize(Policy = Perm.CmsManage)]
    public async Task<IActionResult> SavePolicy(string slug, SavePolicyRequest r, CancellationToken ct)
    {
        var p = await _db.PolicyPages.FirstOrDefaultAsync(x => x.Slug == slug, ct) ?? throw new AppException("Page not found.", 404);
        if (string.IsNullOrWhiteSpace(r.Title)) throw new AppException("A title is required.");
        if (r.BodyHtml.Length > 100_000) throw new AppException("The text is too long.");
        p.Title = r.Title.Trim();
        p.BodyHtml = Sanitise(r.BodyHtml);
        p.UpdatedAt = DateTime.UtcNow;
        _audit.Record(User.UserId(), "Update", "Policy", slug, p.Title);
        await _db.SaveChangesAsync(ct);
        await Evict(ct);
        return Ok(ApiResponse<AdminPolicyDto>.Ok(new AdminPolicyDto(p.Slug, p.Title, p.BodyHtml, p.UpdatedAt), "Page saved."));
    }

    // ---- categories (silos) ----

    [HttpGet("silos")]
    [Authorize(Policy = Perm.CatalogManage)]
    public async Task<IActionResult> Silos(CancellationToken ct)
    {
        var rows = await _db.Silos.AsNoTracking().OrderBy(s => s.DisplayOrder).ToListAsync(ct);
        var urls = await HeroUrls(rows.Select(r => r.HeroMediaId), ct);
        return Ok(ApiResponse<IReadOnlyList<AdminSiloDto>>.Ok(rows.Select(s => new AdminSiloDto(s.SiloId, s.SiloKey, s.Name, s.Intro, s.TopGrades, s.MetaTitle, s.MetaDescription, s.HeroMediaId,
            s.HeroMediaId is { } m ? urls.GetValueOrDefault(m) : null)).ToList()));
    }

    [HttpPut("silos/{id:long}")]
    [Authorize(Policy = Perm.CatalogManage)]
    public async Task<IActionResult> SaveSilo(long id, SaveSiloRequest r, CancellationToken ct)
    {
        var s = await _db.Silos.FirstOrDefaultAsync(x => x.SiloId == id, ct) ?? throw new AppException("Category not found.", 404);
        if (r.HeroMediaId is { } hm && !await _db.MediaAssets.AnyAsync(m => m.MediaId == hm && m.Kind == "image", ct))
            throw new AppException("The chosen photo no longer exists.");
        s.Intro = Clean(r.Intro, 800);
        s.TopGrades = Clean(r.TopGrades, 300);
        s.MetaTitle = Clean(r.MetaTitle, 160);
        s.MetaDescription = Clean(r.MetaDescription, 320);
        s.HeroMediaId = r.HeroMediaId;
        _audit.Record(User.UserId(), "Update", "Silo", s.SiloKey, s.Name);
        await _db.SaveChangesAsync(ct);
        await Evict(ct);
        var urls = await HeroUrls([s.HeroMediaId], ct);
        return Ok(ApiResponse<AdminSiloDto>.Ok(new AdminSiloDto(s.SiloId, s.SiloKey, s.Name, s.Intro, s.TopGrades, s.MetaTitle, s.MetaDescription, s.HeroMediaId,
            s.HeroMediaId is { } m ? urls.GetValueOrDefault(m) : null), "Category saved."));
    }

    // ---- city pages ----

    [HttpGet("cities")]
    [Authorize(Policy = Perm.CatalogManage)]
    public async Task<IActionResult> Cities(CancellationToken ct)
    {
        var rows = await _db.Cities.AsNoTracking().OrderBy(c => c.DisplayOrder).ToListAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<AdminCityDto>>.Ok(rows.Select(ToCity).ToList()));
    }

    [HttpPut("cities/{id:long}")]
    [Authorize(Policy = Perm.CatalogManage)]
    public async Task<IActionResult> SaveCity(long id, SaveCityRequest r, CancellationToken ct)
    {
        var c = await _db.Cities.FirstOrDefaultAsync(x => x.CityId == id, ct) ?? throw new AppException("City not found.", 404);
        c.LeadTime = Clean(r.LeadTime, 60);
        c.Zones = Clean(r.Zones, 300);
        c.Intro = Clean(r.Intro, 800);
        c.IndustriesJson = JsonSerializer.Serialize((r.Industries ?? []).Where(i => !string.IsNullOrWhiteSpace(i)).Select(i => i.Trim()).Take(12), Json);
        c.MetaTitle = Clean(r.MetaTitle, 160);
        c.MetaDescription = Clean(r.MetaDescription, 320);
        c.IsPublished = r.IsPublished;
        _audit.Record(User.UserId(), "Update", "City", c.Slug, c.Name);
        await _db.SaveChangesAsync(ct);
        await Evict(ct);
        return Ok(ApiResponse<AdminCityDto>.Ok(ToCity(c), "City page saved."));
    }

    // ---- helpers ----

    private static AdminCityDto ToCity(City c)
    {
        List<string> ind;
        try { ind = string.IsNullOrWhiteSpace(c.IndustriesJson) ? [] : JsonSerializer.Deserialize<List<string>>(c.IndustriesJson, Json) ?? []; }
        catch (JsonException) { ind = []; }
        return new AdminCityDto(c.CityId, c.Slug, c.Name, c.LeadTime, c.Zones, c.Intro, ind, c.MetaTitle, c.MetaDescription, c.IsPublished);
    }

    private async Task<Dictionary<long, string>> HeroUrls(IEnumerable<long?> ids, CancellationToken ct)
    {
        var list = ids.OfType<long>().Distinct().ToList();
        if (list.Count == 0) return [];
        var rows = await _db.MediaAssets.AsNoTracking().Where(m => list.Contains(m.MediaId)).ToListAsync(ct);
        return rows.ToDictionary(m => m.MediaId, m =>
        {
            var v = Media.MediaService.ParseVariants(m.VariantsJson);
            var widths = v.Keys.OrderBy(k => k).ToList();
            var pick = widths.FirstOrDefault(w => w >= 480);
            return pick != 0 ? v[pick] : widths.Count > 0 ? v[widths[^1]] : m.OriginalUrl;
        });
    }

    private static void CheckScope(string scope)
    {
        if (!FaqScopes.Contains(scope)) throw new AppException("Unknown scope.", 404);
    }

    private static string? Clean(string? s, int max)
    {
        s = s?.Trim();
        if (string.IsNullOrEmpty(s)) return null;
        return s.Length <= max ? s : throw new AppException($"That text is too long (limit {max} characters).");
    }

    /// <summary>
    /// Policy pages are rendered as HTML. Staff are trusted, but a pasted script must still never reach visitors, so only a
    /// small set of formatting tags survives and every attribute is dropped except a safe href on links.
    /// </summary>
    public static string Sanitise(string html)
    {
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "h2", "h3", "p", "ul", "ol", "li", "strong", "b", "em", "i", "br", "a", "table", "thead", "tbody", "tr", "th", "td" };
        return System.Text.RegularExpressions.Regex.Replace(html, @"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>", m =>
        {
            var closing = m.Groups[1].Value;
            var tag = m.Groups[2].Value.ToLowerInvariant();
            if (!allowed.Contains(tag)) return "";
            if (closing == "/") return $"</{tag}>";
            if (tag != "a") return $"<{tag}>";
            var href = System.Text.RegularExpressions.Regex.Match(m.Groups[3].Value, "href\\s*=\\s*\"([^\"]*)\"", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            var url = href.Success ? href.Groups[1].Value.Trim() : "";
            var ok = url.StartsWith("/") || url.StartsWith("https://") || url.StartsWith("http://") || url.StartsWith("mailto:") || url.StartsWith("tel:");
            return ok ? $"<a href=\"{System.Net.WebUtility.HtmlEncode(url)}\">" : "<a>";
        });
    }

    private Task Evict(CancellationToken ct) => _cache.EvictByTagAsync(SiteController.CacheTag, ct).AsTask();
}
