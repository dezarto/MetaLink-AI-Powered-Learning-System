using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class AiPromptRepository : IAiPromptRepository
    {
        private readonly AppDbContext _context;

        public AiPromptRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AiPrompt> CreateAsync(AiPrompt prompt)
        {
            _context.AiPrompts.Add(prompt);
            await _context.SaveChangesAsync();
            return prompt;
        }

        public async Task<AiPrompt> GetByIdAsync(int id) =>
            await _context.AiPrompts.FindAsync(id);

        public async Task<IEnumerable<AiPrompt>> GetAllAsync()
        {
            return await _context.AiPrompts.ToListAsync();
        }

        public async Task<AiPrompt> UpdateAsync(AiPrompt prompt)
        {
            _context.AiPrompts.Update(prompt);
            await _context.SaveChangesAsync();
            return prompt;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var prompt = await _context.AiPrompts.FindAsync(id);
            if (prompt == null) return false;
            _context.AiPrompts.Remove(prompt);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
