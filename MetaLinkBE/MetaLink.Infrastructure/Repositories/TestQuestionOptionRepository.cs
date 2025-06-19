using Metalink.Infrastructure.Context;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class TestQuestionOptionRepository : ITestQuestionOptionRepository
    {
        private readonly AppDbContext _context;

        public TestQuestionOptionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TestQuestionOption> CreateAsync(TestQuestionOption testQuestionOption)
        {
            _context.TestQuestionOptions.Add(testQuestionOption);
            return testQuestionOption;
        }

        public async Task<TestQuestionOption> GetByIdAsync(int optionId)
        {
            return await _context.TestQuestionOptions
                .FirstOrDefaultAsync(o => o.OptionID == optionId);
        }

        public async Task<IEnumerable<TestQuestionOption>> GetAllAsync()
        {
            return await _context.TestQuestionOptions.ToListAsync();
        }

        public async Task<TestQuestionOption> UpdateAsync(TestQuestionOption testQuestionOption)
        {
            _context.TestQuestionOptions.Update(testQuestionOption);
            return testQuestionOption;
        }

        public async Task<bool> DeleteAsync(int optionId)
        {
            var option = await GetByIdAsync(optionId);
            if (option == null)
            {
                return false;
            }

            _context.TestQuestionOptions.Remove(option);
            return true;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
