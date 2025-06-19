using Metalink.Infrastructure.Context;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class TestAnswerRepository : ITestAnswerRepository
    {
        private readonly AppDbContext _context;

        public TestAnswerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TestAnswer> CreateAsync(TestAnswer testAnswer)
        {
            _context.TestAnswers.Add(testAnswer);
            return testAnswer;
        }

        public async Task<TestAnswer> GetByIdAsync(int testAnswerId)
        {
            return await _context.TestAnswers
                .FirstOrDefaultAsync(t => t.TestAnswerID == testAnswerId);
        }

        public async Task<IEnumerable<TestAnswer>> GetAllAsync()
        {
            return await _context.TestAnswers.ToListAsync();
        }

        public async Task<TestAnswer> UpdateAsync(TestAnswer testAnswer)
        {
            _context.TestAnswers.Update(testAnswer);
            return testAnswer;
        }

        public async Task<bool> DeleteAsync(int testAnswerId)
        {
            var testAnswer = await GetByIdAsync(testAnswerId);
            if (testAnswer == null)
            {
                return false;
            }

            _context.TestAnswers.Remove(testAnswer);
            return true;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
