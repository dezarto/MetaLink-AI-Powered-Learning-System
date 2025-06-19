using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class QuizRepository : IQuizRepository
    {
        private readonly AppDbContext _context;

        public QuizRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Quiz> GetQuizByIdAsync(int quizId)
        {
            return await _context.Quizzes
                .Where(q => q.QuizID == quizId)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Quiz>> GetAllQuizzesAsync()
        {
            return await _context.Quizzes.ToListAsync();
        }

        public async Task<Quiz> CreateQuizAsync(Quiz quiz)
        {
            _context.Quizzes.Add(quiz);
            await _context.SaveChangesAsync();
            return quiz;
        }

        public async Task<IEnumerable<Quiz>> GetAllQuizzesByStudentIdAsync(int studentId)
        {
            return await _context.Quizzes
                                 .Where(q => q.StudentId == studentId)
                                 .ToListAsync();
        }

    

        public async Task<Quiz> UpdateQuizAsync(Quiz quiz)
        {
            _context.Quizzes.Update(quiz);
            await _context.SaveChangesAsync();
            return quiz;
        }

        public async Task<bool> DeleteQuizAsync(int quizId)
        {
            var quiz = await _context.Quizzes.FindAsync(quizId);
            if (quiz == null)
                return false;

            _context.Quizzes.Remove(quiz);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
