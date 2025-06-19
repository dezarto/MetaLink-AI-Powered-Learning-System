using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class LearningStyleCategoryRepository : ILearningStyleCategoryRepository
    {
        private readonly AppDbContext _context;

        public LearningStyleCategoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<LearningStyleCategory> GetByIdAsync(int id)
        {
            return await _context.LearningStyleCategories.FindAsync(id);
        }

        public async Task<IEnumerable<LearningStyleCategory>> GetAllAsync()
        {
            return await _context.LearningStyleCategories.ToListAsync();
        }

        public async Task<LearningStyleCategory> AddAsync(LearningStyleCategory learningStyleCategory)
        {
            _context.LearningStyleCategories.Add(learningStyleCategory);
            await _context.SaveChangesAsync();
            return learningStyleCategory;
        }

        public async Task<LearningStyleCategory> UpdateAsync(LearningStyleCategory learningStyleCategory)
        {
            _context.LearningStyleCategories.Update(learningStyleCategory);
            await _context.SaveChangesAsync();
            return learningStyleCategory;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var learningStyleCategory = await GetByIdAsync(id);
            if (learningStyleCategory == null)
                return false;

            _context.LearningStyleCategories.Remove(learningStyleCategory);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
