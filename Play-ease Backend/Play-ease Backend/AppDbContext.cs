using Microsoft.EntityFrameworkCore;
using Play_ease_Backend;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Login> Logins { get; set; }
}
