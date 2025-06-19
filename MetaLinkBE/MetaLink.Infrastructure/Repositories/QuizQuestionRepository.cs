using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class QuizQuestionRepository : IQuizQuestionRepository
    {
        private readonly AppDbContext _context;

        public QuizQuestionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<QuizQuestion> GetQuizQuestionByIdAsync(int questionId)
        {
            return await _context.QuizQuestions
                .Where(q => q.QuestionID == questionId)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<QuizQuestion>> GetQuestionsByQuizIdAsync(int quizId) =>
    await _context.QuizQuestions
        .Where(q => q.QuizID == quizId)
        .ToListAsync();

        public async Task<IEnumerable<QuizQuestion>> GetAllQuizQuestionsAsync()
        {
            return await _context.QuizQuestions.ToListAsync();
        }

        public async Task<QuizQuestion> CreateQuizQuestionAsync(QuizQuestion quizQuestion)
        {
            _context.QuizQuestions.Add(quizQuestion);
            await _context.SaveChangesAsync();
            return quizQuestion;
        }

        public async Task<QuizQuestion> UpdateQuizQuestionAsync(QuizQuestion quizQuestion)
        {
            _context.QuizQuestions.Update(quizQuestion);
            await _context.SaveChangesAsync();
            return quizQuestion;
        }

        public async Task<bool> DeleteQuizQuestionAsync(int questionId)
        {
            var quizQuestion = await _context.QuizQuestions.FindAsync(questionId);
            if (quizQuestion == null)
                return false;

            _context.QuizQuestions.Remove(quizQuestion);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
