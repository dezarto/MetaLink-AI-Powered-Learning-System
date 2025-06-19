using Metalink.Infrastructure.Context;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class TestRepository : ITestRepository
    {
        private readonly AppDbContext _context;

        public TestRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Test> CreateAsync(Test test)
        {
            _context.Tests.Add(test);
            return test;
        }

        public async Task<Test> GetByIdAsync(int testId)
        {
            return await _context.Tests
                .FirstOrDefaultAsync(t => t.TestID == testId);
        }

        public async Task<IEnumerable<Test>> GetAllAsync()
        {
            return await _context.Tests.ToListAsync();
        }

        public async Task<Test> UpdateAsync(Test test)
        {
            _context.Tests.Update(test);
            return test;
        }

        public async Task<bool> DeleteAsync(int testId)
        {
            var test = await GetByIdAsync(testId);
            if (test == null)
            {
                return false;
            }

            _context.Tests.Remove(test);
            return true;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
