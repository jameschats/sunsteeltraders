using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using sunsteel.api.Common.Models;
using sunsteel.api.Common.Security;

namespace sunsteel.api.Features.Leads;

[ApiController]
public sealed class LeadsController : ControllerBase
{
    private readonly ILeadService _leads;

    public LeadsController(ILeadService leads) => _leads = leads;

    // --- public ----------------------------------------------------------------

    /// <summary>Save an RFQ / catalogue / contact / call-back request, then return the WhatsApp link.</summary>
    [HttpPost("api/leads")]
    [EnableRateLimiting("enquiry")]
    public async Task<IActionResult> Create(CreateLeadRequest request, CancellationToken ct)
        => Ok(ApiResponse<LeadCreatedDto>.Ok(
            await _leads.CreateAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString(), ct),
            "Thank you. Your request is with our sales desk."));

    /// <summary>Attach drawings or cut lists to a just-created request (same phone, within 30 minutes).</summary>
    [HttpPost("api/leads/{reference}/files")]
    [EnableRateLimiting("enquiry")]
    [RequestSizeLimit(80 * 1024 * 1024)]
    public async Task<IActionResult> Files(string reference, [FromForm] string phone, CancellationToken ct)
    {
        var count = await _leads.AttachFilesAsync(reference, phone, Request.Form.Files, ct);
        return Ok(ApiResponse<object>.Ok(new { files = count }, "Files received."));
    }

    [HttpPost("api/events/click")]
    public async Task<IActionResult> Click(ClickRequest request, CancellationToken ct)
    {
        await _leads.RecordClickAsync(request, ct);
        return NoContent();
    }

    // --- admin -----------------------------------------------------------------

    [HttpGet("api/admin/leads")]
    [Authorize(Policy = Perm.LeadManage)]
    public async Task<IActionResult> List([FromQuery] string? type, [FromQuery] string? status, [FromQuery] string? q,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<LeadRowDto>>.Ok(await _leads.ListAsync(type, status, q, page, pageSize, ct)));

    [HttpGet("api/admin/leads/{id:long}")]
    [Authorize(Policy = Perm.LeadManage)]
    public async Task<IActionResult> Get(long id, CancellationToken ct)
        => Ok(ApiResponse<LeadDetailDto>.Ok(await _leads.GetAsync(id, ct)));

    [HttpPut("api/admin/leads/{id:long}/status")]
    [Authorize(Policy = Perm.LeadManage)]
    public async Task<IActionResult> Status(long id, UpdateLeadStatusRequest request, CancellationToken ct)
        => Ok(ApiResponse<LeadDetailDto>.Ok(await _leads.SetStatusAsync(User.UserId(), id, request.Status, ct), "Status updated."));

    [HttpPost("api/admin/leads/{id:long}/notes")]
    [Authorize(Policy = Perm.LeadManage)]
    public async Task<IActionResult> Note(long id, AddLeadNoteRequest request, CancellationToken ct)
        => Ok(ApiResponse<LeadDetailDto>.Ok(await _leads.AddNoteAsync(User.UserId(), id, request.Note, ct), "Note added."));

    [HttpGet("api/admin/lead-files/{fileId:long}")]
    [Authorize(Policy = Perm.LeadManage)]
    public async Task<IActionResult> Download(long fileId, CancellationToken ct)
    {
        var (stream, type, name) = await _leads.OpenFileAsync(fileId, ct);
        return File(stream, type, name);
    }
}
