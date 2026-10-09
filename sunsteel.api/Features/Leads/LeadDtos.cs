namespace sunsteel.api.Features.Leads;

public sealed record LeadItemRequest(
    string? ProductSlug, string? GradeText, string Form, Dictionary<string, double>? Dims, string? Section,
    double LengthMm, int Quantity, bool CutToSize);

/// <summary>Public submit: RFQ, catalogue download gate, contact message or call-back.</summary>
public sealed record CreateLeadRequest(
    string Type, string Name, string Phone, string? Company, string? Gstin, string? Email, string? City,
    string? Industry, string? Message, DateTime? CallbackAt, string? Channel, string? SourcePage, string? UtmSource,
    IReadOnlyList<LeadItemRequest>? Items,
    // Honeypot: real visitors never see or fill this field.
    string? Website);

public sealed record LeadItemDto(string GradeText, string Form, string DimsText, decimal? LengthMm, int Quantity, decimal? Kg, bool CutToSize, string? ProductPath);

/// <summary>Returned to the browser after save, including the WhatsApp text to open.</summary>
public sealed record LeadCreatedDto(string Reference, decimal? TotalKg, IReadOnlyList<LeadItemDto> Items, string WhatsAppUrl);

public sealed record LeadRowDto(long LeadId, string Reference, string Type, string Status, string Channel, string Name, string? Company,
    string Phone, string? City, int ItemCount, decimal? TotalKg, int FileCount, DateTime CreatedAt);

public sealed record LeadNoteDto(long LeadNoteId, string Note, string? By, DateTime CreatedAt);
public sealed record LeadFileDto(long LeadFileId, string FileName, string ContentType, long SizeBytes);

public sealed record LeadDetailDto(
    long LeadId, string Reference, string Type, string Status, string Channel, string Name, string? Company, string? Gstin,
    string Phone, string? Email, string? City, string? Industry, string? Message, DateTime? CallbackAt, decimal? TotalKg,
    string? SourcePage, DateTime CreatedAt, IReadOnlyList<LeadItemDto> Items, IReadOnlyList<LeadFileDto> Files, IReadOnlyList<LeadNoteDto> Notes);

public sealed record UpdateLeadStatusRequest(string Status);
public sealed record AddLeadNoteRequest(string Note);
public sealed record ClickRequest(string Kind, string? Page);
