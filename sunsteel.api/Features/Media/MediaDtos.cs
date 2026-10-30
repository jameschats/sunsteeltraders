namespace sunsteel.api.Features.Media;

/// <summary>
/// An image as the website and admin see it. <see cref="Variants"/> maps pixel width to a WebP
/// URL, so the client can build a srcset; <see cref="Placeholder"/> is a tiny blurred data URI
/// shown while the real image loads.
/// </summary>
public sealed record MediaDto(
    long Id,
    string Kind,
    string FileName,
    string Url,
    IReadOnlyDictionary<int, string> Variants,
    string? Placeholder,
    int? Width,
    int? Height,
    long SizeBytes,
    string? AltText,
    string? Caption,
    string? Category,
    DateTime CreatedAt);

public sealed record UpdateMediaRequest(string? AltText, string? Caption, string? Category);
