using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class QuizAnswerRepository : IQuizAnswerRepository
    {
        private readonly AppDbContext _context;

        public QuizAnswerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<QuizAnswer> GetAnswerByStudentAndQuizAsync(int studentId, int quizId)
        {
            return await _context.QuizAnswers
                .Where(qa => qa.StudentID == studentId
                          && qa.QuizID == quizId)      // ← use QuizID
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<QuizAnswer>> GetAllQuizAnswersAsync()
        {
            return await _context.QuizAnswers.ToListAsync();
        }

        public async Task<QuizAnswer> CreateQuizAnswerAsync(QuizAnswer quizAnswer)
        {
            _context.QuizAnswers.Add(quizAnswer);
            await _context.SaveChangesAsync();
            return quizAnswer;
        }

        public async Task<QuizAnswer> UpdateQuizAnswerAsync(QuizAnswer quizAnswer)
        {
            _context.QuizAnswers.Update(quizAnswer);
            await _context.SaveChangesAsync();
            return quizAnswer;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteQuizAnswerAsync(int quizAnswerId)
        {
            var quizAnswer = await _context.QuizAnswers.FindAsync(quizAnswerId);
            if (quizAnswer == null)
                return false;

            _context.QuizAnswers.Remove(quizAnswer);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
