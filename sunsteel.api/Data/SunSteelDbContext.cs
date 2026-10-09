using Microsoft.EntityFrameworkCore;
using sunsteel.api.Data.Entities;

namespace sunsteel.api.Data;

/// <summary>
/// Database-first context. Tables are created by database/migrations/*.sql; entities are
/// mapped explicitly with ToTable(...) because MySQL on Windows lower-cases table names.
/// Catalogue, content and leads are mapped below; Media lands with the Stage 3 pipeline.
/// </summary>
public sealed class SunSteelDbContext : DbContext
{
    public SunSteelDbContext(DbContextOptions<SunSteelDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserExternalLogin> UserExternalLogins => Set<UserExternalLogin>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<ThemeSetting> ThemeSettings => Set<ThemeSetting>();
    public DbSet<AuditEntry> AuditLog => Set<AuditEntry>();
    public DbSet<Silo> Silos => Set<Silo>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<SectionWeight> SectionWeights => Set<SectionWeight>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<DeliveryLeadTime> DeliveryLeadTimes => Set<DeliveryLeadTime>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<Faq> Faqs => Set<Faq>();
    public DbSet<PolicyPage> PolicyPages => Set<PolicyPage>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<LeadItem> LeadItems => Set<LeadItem>();
    public DbSet<LeadFile> LeadFiles => Set<LeadFile>();
    public DbSet<LeadNote> LeadNotes => Set<LeadNote>();
    public DbSet<ClickEvent> ClickEvents => Set<ClickEvent>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.UserId);
            e.HasIndex(x => x.NormalizedEmail).IsUnique();
        });

        b.Entity<Role>(e =>
        {
            e.ToTable("Roles");
            e.HasKey(x => x.RoleId);
        });

        b.Entity<Permission>(e =>
        {
            e.ToTable("Permissions");
            e.HasKey(x => x.PermissionId);
        });

        b.Entity<UserRole>(e =>
        {
            e.ToTable("UserRoles");
            e.HasKey(x => new { x.UserId, x.RoleId });
            e.HasOne(x => x.User).WithMany(u => u.UserRoles).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Role).WithMany().HasForeignKey(x => x.RoleId);
        });

        b.Entity<RolePermission>(e =>
        {
            e.ToTable("RolePermissions");
            e.HasKey(x => new { x.RoleId, x.PermissionId });
            e.HasOne(x => x.Role).WithMany(r => r.RolePermissions).HasForeignKey(x => x.RoleId);
            e.HasOne(x => x.Permission).WithMany().HasForeignKey(x => x.PermissionId);
        });

        b.Entity<UserExternalLogin>(e =>
        {
            e.ToTable("UserExternalLogins");
            e.HasKey(x => x.UserExternalLoginId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        b.Entity<RefreshToken>(e =>
        {
            e.ToTable("RefreshTokens");
            e.HasKey(x => x.RefreshTokenId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        b.Entity<SiteSetting>(e => { e.ToTable("SiteSettings"); e.HasKey(x => x.SettingKey); });
        b.Entity<ThemeSetting>(e => { e.ToTable("ThemeSettings"); e.HasKey(x => x.SettingKey); });

        b.Entity<AuditEntry>(e =>
        {
            e.ToTable("AuditLog");
            e.HasKey(x => x.AuditId);
        });

        // --- Catalogue (006) -------------------------------------------------
        b.Entity<Silo>(e => { e.ToTable("Silos"); e.HasKey(x => x.SiloId); e.HasIndex(x => x.SiloKey).IsUnique(); });
        b.Entity<Material>(e => { e.ToTable("Materials"); e.HasKey(x => x.MaterialKey); e.Property(x => x.Density).HasPrecision(6, 3); });
        b.Entity<Product>(e =>
        {
            e.ToTable("Products");
            e.HasKey(x => x.ProductId);
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasOne(x => x.Silo).WithMany(s => s.Products).HasForeignKey(x => x.SiloId);
            e.HasOne(x => x.Material).WithMany().HasForeignKey(x => x.MaterialKey);
            e.Property(x => x.ChemistryJson).HasColumnType("json");
            e.Property(x => x.MechanicalJson).HasColumnType("json");
            e.Property(x => x.EquivalentsJson).HasColumnType("json");
        });
        b.Entity<SectionWeight>(e => { e.ToTable("SectionWeights"); e.HasKey(x => x.Designation); e.Property(x => x.KgPerMetre).HasPrecision(8, 2); });
        b.Entity<City>(e =>
        {
            e.ToTable("Cities");
            e.HasKey(x => x.CityId);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.IndustriesJson).HasColumnType("json");
            e.Property(x => x.PopularSlugsJson).HasColumnType("json");
        });
        b.Entity<DeliveryLeadTime>(e => { e.ToTable("DeliveryLeadTimes"); e.HasKey(x => x.City); });

        // --- Content (007) ---------------------------------------------------
        b.Entity<Page>(e => { e.ToTable("Pages"); e.HasKey(x => x.PageId); e.HasIndex(x => x.Slug).IsUnique(); });
        b.Entity<Faq>(e => { e.ToTable("Faqs"); e.HasKey(x => x.FaqId); });
        b.Entity<PolicyPage>(e => { e.ToTable("PolicyPages"); e.HasKey(x => x.Slug); });

        // --- Leads (008) -----------------------------------------------------
        b.Entity<Lead>(e =>
        {
            e.ToTable("Leads");
            e.HasKey(x => x.LeadId);
            e.HasIndex(x => x.Reference).IsUnique();
            e.Property(x => x.TotalKg).HasPrecision(12, 2);
            e.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.LeadId);
            e.HasMany(x => x.Files).WithOne().HasForeignKey(f => f.LeadId);
            e.HasMany(x => x.Notes).WithOne().HasForeignKey(n => n.LeadId);
        });
        b.Entity<LeadItem>(e =>
        {
            e.ToTable("LeadItems");
            e.HasKey(x => x.LeadItemId);
            e.Property(x => x.DimsJson).HasColumnType("json");
            e.Property(x => x.LengthMm).HasPrecision(10, 1);
            e.Property(x => x.Kg).HasPrecision(12, 2);
        });
        b.Entity<LeadFile>(e => { e.ToTable("LeadFiles"); e.HasKey(x => x.LeadFileId); });
        b.Entity<LeadNote>(e => { e.ToTable("LeadNotes"); e.HasKey(x => x.LeadNoteId); });
        b.Entity<ClickEvent>(e => { e.ToTable("ClickEvents"); e.HasKey(x => x.ClickEventId); });
    }
}
