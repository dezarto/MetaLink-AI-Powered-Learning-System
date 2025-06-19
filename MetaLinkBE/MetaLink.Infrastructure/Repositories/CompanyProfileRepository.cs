using Metalink.Infrastructure.Context;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class CompanyProfileRepository : ICompanyProfileRepository
    {
        private readonly AppDbContext _context;

        public CompanyProfileRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CompanyProfile?> GetAsync()
        {
            return await _context.CompanyProfiles.FirstOrDefaultAsync();
        }

        public async Task CreateAsync(CompanyProfile profile)
        {
            await _context.CompanyProfiles.AddAsync(profile);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(CompanyProfile profile)
        {
            _context.CompanyProfiles.Update(profile);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var profile = await _context.CompanyProfiles.FindAsync(id);
            if (profile != null)
            {
                _context.CompanyProfiles.Remove(profile);
                await _context.SaveChangesAsync();
            }
        }
    }
}
