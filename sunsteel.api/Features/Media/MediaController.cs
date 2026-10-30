using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using sunsteel.api.Common.Models;
using sunsteel.api.Common.Security;
using sunsteel.api.Features.Site;

namespace sunsteel.api.Features.Media;

[ApiController]
[Route("api/admin/media")]
[Authorize(Policy = Perm.MediaManage)]
public sealed class MediaController : ControllerBase
{
    private readonly IMediaService _media;
    private readonly IOutputCacheStore _cache;

    public MediaController(IMediaService media, IOutputCacheStore cache)
    {
        _media = media;
        _cache = cache;
    }

    [HttpGet("categories")]
    public IActionResult Categories() => Ok(ApiResponse<string[]>.Ok(MediaService.Categories));

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? category, [FromQuery] string? kind, [FromQuery] string? q,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 24, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<MediaDto>>.Ok(await _media.ListAsync(category, kind, q, page, pageSize, ct)));

    /// <summary>Upload one image. Several files are sent as several requests so each gets its own result.</summary>
    [HttpPost]
    [RequestSizeLimit(32_000_000)]
    public async Task<IActionResult> Upload(IFormFile file, [FromForm] string? category, [FromForm] string? altText,
        [FromForm] string? caption, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        var dto = await _media.SaveImageAsync(stream, file.FileName, category, altText, caption, User.UserId(), ct);
        await _cache.EvictByTagAsync(SiteController.CacheTag, ct);
        return Ok(ApiResponse<MediaDto>.Ok(dto, "Image uploaded."));
    }

    /// <summary>Upload a short MP4/WebM clip (hero backgrounds). Stored as is; compress before uploading.</summary>
    [HttpPost("video")]
    [RequestSizeLimit(90_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 90_000_000)]
    public async Task<IActionResult> UploadVideo(IFormFile file, [FromForm] string? category, [FromForm] string? altText,
        [FromForm] string? caption, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        var dto = await _media.SaveVideoAsync(stream, file.FileName, category, altText, caption, User.UserId(), ct);
        await _cache.EvictByTagAsync(SiteController.CacheTag, ct);
        return Ok(ApiResponse<MediaDto>.Ok(dto, "Video uploaded."));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateMediaRequest req, CancellationToken ct)
    {
        var dto = await _media.UpdateAsync(User.UserId(), id, req, ct);
        await _cache.EvictByTagAsync(SiteController.CacheTag, ct);
        return Ok(ApiResponse<MediaDto>.Ok(dto, "Image updated."));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        await _media.DeleteAsync(User.UserId(), id, ct);
        await _cache.EvictByTagAsync(SiteController.CacheTag, ct);
        return Ok(ApiResponse<object>.Ok(new { deleted = true }, "Image deleted."));
    }
}
