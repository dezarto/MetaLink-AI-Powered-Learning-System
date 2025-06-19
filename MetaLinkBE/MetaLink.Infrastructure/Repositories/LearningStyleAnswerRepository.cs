using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class LearningStyleAnswerRepository : ILearningStyleAnswerRepository
    {
        private readonly AppDbContext _context;

        public LearningStyleAnswerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<LearningStyleAnswer> GetByIdAsync(int id)
        {
            return await _context.LearningStyleAnswers.FindAsync(id);
        }

        public async Task<IEnumerable<LearningStyleAnswer>> GetAllAsync()
        {
            return await _context.LearningStyleAnswers.ToListAsync();
        }

        public async Task<LearningStyleAnswer> AddAsync(LearningStyleAnswer learningStyleAnswer)
        {
            _context.LearningStyleAnswers.Add(learningStyleAnswer);
            await _context.SaveChangesAsync();
            return learningStyleAnswer;
        }

        public async Task<LearningStyleAnswer> UpdateAsync(LearningStyleAnswer learningStyleAnswer)
        {
            _context.LearningStyleAnswers.Update(learningStyleAnswer);
            await _context.SaveChangesAsync();
            return learningStyleAnswer;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var learningStyleAnswer = await GetByIdAsync(id);
            if (learningStyleAnswer == null)
                return false;

            _context.LearningStyleAnswers.Remove(learningStyleAnswer);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
