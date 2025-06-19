using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class XPRecordRepository : IXPRecordRepository
    {
        private readonly AppDbContext _context;

        public XPRecordRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<XPRecord> GetByIdAsync(int id)
        {
            return await _context.XPRecords.FindAsync(id);
        }

        public async Task<List<XPRecord>> GetByStudentIdAsync(int studentId)
        {
            return await _context.XPRecords.Where(x => x.StudentId == studentId).ToListAsync();
        }

        public async Task AddAsync(XPRecord xpRecord)
        {
            await _context.XPRecords.AddAsync(xpRecord);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(XPRecord xpRecord)
        {
            _context.XPRecords.Update(xpRecord);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var xpRecord = await GetByIdAsync(id);
            if (xpRecord != null)
            {
                _context.XPRecords.Remove(xpRecord);
                await _context.SaveChangesAsync();
            }
        }
    }
}
