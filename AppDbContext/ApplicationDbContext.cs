using BackendGermanSmartDetector.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendGermanSmartDetector.AppDbContext
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Users> Users { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Ignore<UserLoginModel>();
            base.OnModelCreating(modelBuilder);
        }
    }
}
