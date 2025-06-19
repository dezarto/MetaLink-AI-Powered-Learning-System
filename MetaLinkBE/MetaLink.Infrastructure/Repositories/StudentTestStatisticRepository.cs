using Metalink.Infrastructure.Context;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class StudentTestStatisticRepository : IStudentTestStatisticRepository
    {
        private readonly AppDbContext _context;

        public StudentTestStatisticRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StudentTestStatistic>> GetBySubLessonIdAsync(int subLessonId)
        {
            var testIds = await _context.Tests
                .Where(t => t.SubLessonID == subLessonId)
                .Select(t => t.TestID)
                .ToListAsync();

            return await _context.StudentTestStatistics
                .Where(stat => stat.TestID.HasValue
                               && testIds.Contains(stat.TestID.Value))
                .ToListAsync();
        }

        public async Task<IEnumerable<StudentTestStatistic>> GetBySubLessonQuizIdAsync(int subLessonId)
        {
        
            var quizIds = await _context.Quizzes
                .Where(q => q.SubLessonID == subLessonId)
                .Select(q => q.QuizID)
                .ToListAsync();

            return await _context.StudentTestStatistics
                .Where(stat => stat.QuizID.HasValue
                               && quizIds.Contains(stat.QuizID.Value))
                .ToListAsync();
        }

        public async Task<List<StudentTestStatistic>> GetStatisticByStudentAsync(int studentId)
        {
            return await _context.StudentTestStatistics
                .Where(stat => stat.StudentID == studentId)
                .ToListAsync();
        }

        public async Task<IEnumerable<StudentTestStatistic>> GetAllStatisticAsync()
        {
            return await _context.StudentTestStatistics.ToListAsync();
        }

        public async Task<StudentTestStatistic> CreateStatisticAsync(StudentTestStatistic statistic)
        {
            _context.StudentTestStatistics.Add(statistic);
            //await _context.SaveChangesAsync();
            return statistic;
        }

        public async Task<StudentTestStatistic> UpdateStatisticAsync(StudentTestStatistic statistic)
        {
            _context.StudentTestStatistics.Update(statistic);
            await _context.SaveChangesAsync();
            return statistic;
        }

        public async Task<bool> DeleteStatisticAsync(int statisticId)
        {
            var statistic = await _context.StudentTestStatistics.FindAsync(statisticId);
            if (statistic == null)
                return false;

            _context.StudentTestStatistics.Remove(statistic);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
