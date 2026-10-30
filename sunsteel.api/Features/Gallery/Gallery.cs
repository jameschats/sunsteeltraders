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
using sunsteel.api.Features.Media;
using sunsteel.api.Features.Site;

namespace sunsteel.api.Features.Gallery;

public sealed record GalleryItemDto(long Id, long MediaId, MediaDto? Media, string? Title, string? Caption, string? LinkUrl, bool Visible);
public sealed record GallerySettingsDto(bool Show, string Kicker, string Heading, int Speed);
/// <summary>What the admin editor loads and saves in one go.</summary>
public sealed record GalleryAdminDto(GallerySettingsDto Settings, IReadOnlyList<GalleryItemDto> Items);
/// <summary>An item as the editor sends it. A missing Id means a new item.</summary>
public sealed record SaveGalleryItem(long? Id, long MediaId, string? Title, string? Caption, string? LinkUrl, bool Visible);
public sealed record SaveGalleryRequest(GallerySettingsDto Settings, List<SaveGalleryItem> Items);
/// <summary>Visible items only, with their photos, for the home page.</summary>
public sealed record GalleryPublicDto(GallerySettingsDto Settings, IReadOnlyList<GalleryItemDto> Items);

public interface IGalleryService
{
    Task<GalleryAdminDto> GetAsync(bool publicOnly, CancellationToken ct = default);
    Task<GalleryAdminDto> SaveAsync(long actorId, SaveGalleryRequest req, CancellationToken ct = default);
}

public sealed class GalleryService : IGalleryService
{
    private const int MaxItems = 60;
    private readonly SunSteelDbContext _db;
    private readonly IAuditService _audit;

    public GalleryService(SunSteelDbContext db, IAuditService audit) { _db = db; _audit = audit; }

    public async Task<GalleryAdminDto> GetAsync(bool publicOnly, CancellationToken ct = default)
    {
        var q = _db.GalleryItems.AsNoTracking().AsQueryable();
        if (publicOnly) q = q.Where(g => g.IsVisible);
        var rows = await q.OrderBy(g => g.DisplayOrder).ThenBy(g => g.GalleryItemId).ToListAsync(ct);
        var ids = rows.Select(r => r.MediaId).Distinct().ToList();
        var media = (await _db.MediaAssets.AsNoTracking().Where(m => ids.Contains(m.MediaId)).ToListAsync(ct)).ToDictionary(m => m.MediaId, MediaService.ToDto);
        var items = rows.Where(r => !publicOnly || media.ContainsKey(r.MediaId))
            .Select(r => new GalleryItemDto(r.GalleryItemId, r.MediaId, media.GetValueOrDefault(r.MediaId), r.Title, r.Caption, r.LinkUrl, r.IsVisible)).ToList();
        return new GalleryAdminDto(await ReadSettingsAsync(ct), items);
    }

    public async Task<GalleryAdminDto> SaveAsync(long actorId, SaveGalleryRequest req, CancellationToken ct = default)
    {
        var items = req.Items;
        if (items.Count > MaxItems) throw new AppException($"The gallery can hold at most {MaxItems} photos.");

        var mediaIds = items.Select(i => i.MediaId).Distinct().ToList();
        var found = await _db.MediaAssets.Where(m => mediaIds.Contains(m.MediaId)).Select(m => new { m.MediaId, m.Kind }).ToListAsync(ct);
        if (found.Count != mediaIds.Count) throw new AppException("One of the chosen photos no longer exists. Please choose it again.");
        if (found.Any(m => m.Kind != "image")) throw new AppException("The gallery can only hold photos, not videos.");

        var s = req.Settings;
        if (s.Speed is < 10 or > 150) throw new AppException("Speed must be between 10 and 150.");
        var kicker = Clean(s.Kicker, 80) ?? "";
        var heading = Clean(s.Heading, 120) ?? "";

        var existing = await _db.GalleryItems.ToListAsync(ct);
        var keep = new HashSet<long>();
        var order = 0;
        foreach (var item in items)
        {
            order++;
            var row = item.Id is { } id ? existing.FirstOrDefault(g => g.GalleryItemId == id) : null;
            if (row is null) { row = new GalleryItem(); _db.GalleryItems.Add(row); }
            row.MediaId = item.MediaId;
            row.Title = Clean(item.Title, 120);
            row.Caption = Clean(item.Caption, 300);
            row.LinkUrl = CleanLink(item.LinkUrl);
            row.IsVisible = item.Visible;
            row.DisplayOrder = order;
            if (row.GalleryItemId != 0) keep.Add(row.GalleryItemId);
        }
        _db.GalleryItems.RemoveRange(existing.Where(g => !keep.Contains(g.GalleryItemId)));

        await SetAsync("GalleryShow", s.Show ? "1" : "0", ct);
        await SetAsync("GalleryKicker", kicker, ct);
        await SetAsync("GalleryHeading", heading, ct);
        await SetAsync("GallerySpeed", s.Speed.ToString(), ct);

        _audit.Record(actorId, "Update", "Gallery", null, $"{items.Count} photos");
        await _db.SaveChangesAsync(ct);
        return await GetAsync(false, ct);
    }

    private async Task<GallerySettingsDto> ReadSettingsAsync(CancellationToken ct)
    {
        var rows = (await _db.SiteSettings.AsNoTracking().Where(s => s.SettingKey.StartsWith("Gallery")).ToListAsync(ct))
            .ToDictionary(s => s.SettingKey, s => s.SettingValue);
        string V(string k, string d) => rows.TryGetValue(k, out var v) && v is not null ? v : d;
        return new GallerySettingsDto(V("GalleryShow", "1") == "1", V("GalleryKicker", "Around the godown"),
            V("GalleryHeading", "A look inside Sun Steel Traders"), int.TryParse(V("GallerySpeed", "50"), out var sp) ? sp : 50);
    }

    private async Task SetAsync(string key, string value, CancellationToken ct)
    {
        var row = await _db.SiteSettings.FirstOrDefaultAsync(s => s.SettingKey == key, ct);
        if (row is null) _db.SiteSettings.Add(new SiteSetting { SettingKey = key, SettingValue = value });
        else row.SettingValue = value;
    }

    private static string? Clean(string? s, int max)
    {
        s = s?.Trim();
        if (string.IsNullOrEmpty(s)) return null;
        return s.Length <= max ? s : throw new AppException($"That text is too long (limit {max} characters).");
    }

    /// <summary>A page on this site (/contact-us/) or a full http(s) address; nothing else.</summary>
    private static string? CleanLink(string? s)
    {
        s = s?.Trim();
        if (string.IsNullOrEmpty(s)) return null;
        if (s.Length > 300) throw new AppException("That link is too long.");
        var internalLink = s.StartsWith('/') && !s.StartsWith("//") && !s.Contains(' ');
        var external = Uri.TryCreate(s, UriKind.Absolute, out var u) && (u.Scheme == Uri.UriSchemeHttps || u.Scheme == Uri.UriSchemeHttp);
        if (!internalLink && !external) throw new AppException("A link must start with / (a page on this site) or be a full https:// address.");
        return s;
    }
}

[ApiController]
public sealed class GalleryController : ControllerBase
{
    private readonly IGalleryService _gallery;
    private readonly IOutputCacheStore _cache;
    public GalleryController(IGalleryService gallery, IOutputCacheStore cache) { _gallery = gallery; _cache = cache; }

    [HttpGet("api/gallery")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> Public(CancellationToken ct)
    {
        var g = await _gallery.GetAsync(true, ct);
        return Ok(ApiResponse<GalleryPublicDto>.Ok(new GalleryPublicDto(g.Settings, g.Items)));
    }

    [HttpGet("api/admin/gallery")]
    [Authorize(Policy = Perm.MediaManage)]
    public async Task<IActionResult> Admin(CancellationToken ct)
        => Ok(ApiResponse<GalleryAdminDto>.Ok(await _gallery.GetAsync(false, ct)));

    [HttpPut("api/admin/gallery")]
    [Authorize(Policy = Perm.MediaManage)]
    public async Task<IActionResult> Save(SaveGalleryRequest req, CancellationToken ct)
    {
        var result = await _gallery.SaveAsync(User.UserId(), req, ct);
        await _cache.EvictByTagAsync(SiteController.CacheTag, ct);
        return Ok(ApiResponse<GalleryAdminDto>.Ok(result, "Gallery saved. The website shows it now."));
    }
}
