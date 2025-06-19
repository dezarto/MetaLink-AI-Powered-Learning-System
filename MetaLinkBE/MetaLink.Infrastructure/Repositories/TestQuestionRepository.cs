using Metalink.Infrastructure.Context;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class TestQuestionRepository : ITestQuestionRepository
    {
        private readonly AppDbContext _context;

        public TestQuestionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TestQuestion> CreateAsync(TestQuestion testQuestion)
        {
            _context.TestQuestions.Add(testQuestion);
            return testQuestion;
        }

        public async Task<TestQuestion> GetByIdAsync(int questionId)
        {
            return await _context.TestQuestions
                .FirstOrDefaultAsync(q => q.QuestionID == questionId);
        }

        public async Task<IEnumerable<TestQuestion>> GetAllAsync()
        {
            return await _context.TestQuestions.ToListAsync();
        }

        public async Task<TestQuestion> UpdateAsync(TestQuestion testQuestion)
        {
            _context.TestQuestions.Update(testQuestion);
            return testQuestion;
        }

        public async Task<bool> DeleteAsync(int questionId)
        {
            var question = await GetByIdAsync(questionId);
            if (question == null)
            {
                return false;
            }

            _context.TestQuestions.Remove(question);
            return true;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
