using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class LearningStyleQuestionRepository : ILearningStyleQuestionRepository
    {
        private readonly AppDbContext _context;

        public LearningStyleQuestionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<LearningStyleQuestion> GetByIdAsync(int id)
        {
            return await _context.LearningStyleQuestions.FindAsync(id);
        }

        public async Task<IEnumerable<LearningStyleQuestion>> GetAllAsync()
        {
            return await _context.LearningStyleQuestions.ToListAsync();
        }

        public async Task<LearningStyleQuestion> AddAsync(LearningStyleQuestion learningStyleQuestion)
        {
            _context.LearningStyleQuestions.Add(learningStyleQuestion);
            await _context.SaveChangesAsync();
            return learningStyleQuestion;
        }

        public async Task<LearningStyleQuestion> UpdateAsync(LearningStyleQuestion learningStyleQuestion)
        {
            _context.LearningStyleQuestions.Update(learningStyleQuestion);
            await _context.SaveChangesAsync();
            return learningStyleQuestion;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var learningStyleQuestion = await GetByIdAsync(id);
            if (learningStyleQuestion == null)
                return false;

            _context.LearningStyleQuestions.Remove(learningStyleQuestion);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
