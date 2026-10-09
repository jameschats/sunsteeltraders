using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using sunsteel.api.Common.Models;
using sunsteel.api.Common.Security;
using sunsteel.api.Features.Site;

namespace sunsteel.api.Features.Catalog;

[ApiController]
public sealed class CatalogController : ControllerBase
{
    private readonly ICatalogService _catalog;
    private readonly IOutputCacheStore _cache;

    public CatalogController(ICatalogService catalog, IOutputCacheStore cache)
    {
        _catalog = catalog;
        _cache = cache;
    }

    // --- public (cached, evicted on any admin save) ---------------------------

    [HttpGet("api/catalog")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> Index(CancellationToken ct)
        => Ok(ApiResponse<CatalogIndexDto>.Ok(await _catalog.GetIndexAsync(ct)));

    [HttpGet("api/catalog/silos/{key}")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> Silo(string key, CancellationToken ct)
        => Ok(ApiResponse<SiloDto>.Ok(await _catalog.GetSiloAsync(key, ct)));

    [HttpGet("api/catalog/products")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> Products(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<ProductCardDto>>.Ok(await _catalog.ListProductsAsync(ct)));

    [HttpGet("api/catalog/products/{siloKey}/{slug}")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> Product(string siloKey, string slug, CancellationToken ct)
        => Ok(ApiResponse<ProductDto>.Ok(await _catalog.GetProductAsync(siloKey, slug, ct)));

    [HttpGet("api/catalog/search")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int limit = 8, CancellationToken ct = default)
        => Ok(ApiResponse<IReadOnlyList<SearchHitDto>>.Ok(await _catalog.SearchAsync(q, limit, ct)));

    [HttpGet("api/catalog/cities/{slug}")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> City(string slug, CancellationToken ct)
        => Ok(ApiResponse<CityDto>.Ok(await _catalog.GetCityAsync(slug, ct)));

    [HttpGet("api/pages")]
    [HttpGet("api/pages/{**slug}")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> Page(string? slug, CancellationToken ct)
        => Ok(ApiResponse<PageDto>.Ok(await _catalog.GetPageAsync((slug ?? "").Trim('/'), ct)));

    [HttpGet("api/policies/{slug}")]
    [OutputCache(PolicyName = "public")]
    public async Task<IActionResult> Policy(string slug, CancellationToken ct)
        => Ok(ApiResponse<PolicyDto>.Ok(await _catalog.GetPolicyAsync(slug, ct)));

    // --- admin -----------------------------------------------------------------

    [HttpGet("api/admin/products")]
    [Authorize(Policy = Perm.StockManage)]
    public async Task<IActionResult> List([FromQuery] string? silo, [FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 100, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<AdminProductRowDto>>.Ok(await _catalog.AdminListAsync(silo, q, page, pageSize, ct)));

    [HttpGet("api/admin/products/{id:long}")]
    [Authorize(Policy = Perm.CatalogManage)]
    public async Task<IActionResult> Get(long id, CancellationToken ct)
        => Ok(ApiResponse<ProductDto>.Ok(await _catalog.AdminGetAsync(id, ct)));

    [HttpPut("api/admin/products/{id:long}")]
    [Authorize(Policy = Perm.CatalogManage)]
    public async Task<IActionResult> Update(long id, UpdateProductRequest request, CancellationToken ct)
    {
        var result = await _catalog.UpdateAsync(User.UserId(), id, request, ct);
        await _cache.EvictByTagAsync(SiteController.CacheTag, ct);
        return Ok(ApiResponse<ProductDto>.Ok(result, "Product saved."));
    }

    /// <summary>One-click stock board toggle.</summary>
    [HttpPut("api/admin/products/{id:long}/stock")]
    [Authorize(Policy = Perm.StockManage)]
    public async Task<IActionResult> Stock(long id, UpdateStockRequest request, CancellationToken ct)
    {
        await _catalog.UpdateStockAsync(User.UserId(), id, request.StockStatus, ct);
        await _cache.EvictByTagAsync(SiteController.CacheTag, ct);
        return Ok(ApiResponse<object>.Ok(new { request.StockStatus }, "Stock updated."));
    }

    [HttpPut("api/admin/materials/{key}")]
    [Authorize(Policy = Perm.CatalogManage)]
    public async Task<IActionResult> Density(string key, UpdateDensityRequest request, CancellationToken ct)
    {
        await _catalog.UpdateDensityAsync(User.UserId(), key, request.Density, ct);
        await _cache.EvictByTagAsync(SiteController.CacheTag, ct);
        return Ok(ApiResponse<object>.Ok(new { key, request.Density }, "Density saved."));
    }
}
