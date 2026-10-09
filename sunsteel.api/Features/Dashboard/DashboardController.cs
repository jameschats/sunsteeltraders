using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using sunsteel.api.Common.Models;
using sunsteel.api.Data;

namespace sunsteel.api.Features.Dashboard;

public sealed record DashboardDto(int NewLeads, int LeadsThisWeek, int QuotedOpen, decimal KgRequestedThisWeek,
    int WhatsAppClicks7d, int CallClicks7d, int LimitedOrOnOrder, IReadOnlyList<RecentLeadDto> Recent);

public sealed record RecentLeadDto(long LeadId, string Reference, string Type, string Status, string Name, string? City, decimal? TotalKg, DateTime CreatedAt);

/// <summary>The numbers on the admin home screen. Any signed-in staff member may see them.</summary>
[ApiController]
[Authorize]
public sealed class DashboardController : ControllerBase
{
    private readonly SunSteelDbContext _db;

    public DashboardController(SunSteelDbContext db) => _db = db;

    [HttpGet("api/admin/dashboard")]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var since = DateTime.UtcNow.AddDays(-7);
        var week = _db.Leads.AsNoTracking().Where(l => l.CreatedAt >= since);
        var dto = new DashboardDto(
            await _db.Leads.CountAsync(l => l.Status == "New", ct),
            await week.CountAsync(ct),
            await _db.Leads.CountAsync(l => l.Status == "Quoted", ct),
            await week.SumAsync(l => l.TotalKg ?? 0, ct),
            await _db.ClickEvents.CountAsync(c => c.Kind == "wa" && c.At >= since, ct),
            await _db.ClickEvents.CountAsync(c => c.Kind == "call" && c.At >= since, ct),
            await _db.Products.CountAsync(p => p.StockStatus != "In stock", ct),
            await _db.Leads.AsNoTracking().OrderByDescending(l => l.CreatedAt).Take(8)
                .Select(l => new RecentLeadDto(l.LeadId, l.Reference, l.Type, l.Status, l.Name, l.City, l.TotalKg, l.CreatedAt)).ToListAsync(ct));
        return Ok(ApiResponse<DashboardDto>.Ok(dto));
    }
}
