using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class QuizQuestionOptionRepository : IQuizQuestionOptionRepository
    {
        private readonly AppDbContext _context;

        public QuizQuestionOptionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<QuizQuestionOption> GetQuizQuestionOptionByIdAsync(int optionId)
        {
            return await _context.QuizQuestionOptions
                .Where(o => o.OptionID == optionId)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<QuizQuestionOption>> GetOptionsByQuestionIdAsync(int questionId) =>
      await _context.QuizQuestionOptions
          .Where(o => o.QuestionID == questionId)
          .ToListAsync();

        public async Task<IEnumerable<QuizQuestionOption>> GetAllQuizQuestionOptionsAsync()
        {
            return await _context.QuizQuestionOptions.ToListAsync();
        }

        public async Task<QuizQuestionOption> CreateQuizQuestionOptionAsync(QuizQuestionOption quizQuestionOption)
        {
            _context.QuizQuestionOptions.Add(quizQuestionOption);
            await _context.SaveChangesAsync();
            return quizQuestionOption;
        }

        public async Task<QuizQuestionOption> UpdateQuizQuestionOptionAsync(QuizQuestionOption quizQuestionOption)
        {
            _context.QuizQuestionOptions.Update(quizQuestionOption);
            await _context.SaveChangesAsync();
            return quizQuestionOption;
        }

        public async Task<bool> DeleteQuizQuestionOptionAsync(int optionId)
        {
            var quizQuestionOption = await _context.QuizQuestionOptions.FindAsync(optionId);
            if (quizQuestionOption == null)
                return false;

            _context.QuizQuestionOptions.Remove(quizQuestionOption);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
