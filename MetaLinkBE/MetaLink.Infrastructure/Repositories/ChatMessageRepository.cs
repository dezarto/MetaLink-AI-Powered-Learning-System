using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class ChatMessageRepository : IChatMessageRepository
    {
        private readonly AppDbContext _context;

        public ChatMessageRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ChatMessage message)
        {
            await _context.ChatMessages.AddAsync(message);
            await _context.SaveChangesAsync();
        }

        public async Task<ChatMessage?> GetByIdAsync(int id)
        {
            return await _context.ChatMessages.FindAsync(id);
        }

        public async Task<List<ChatMessage>> GetAllAsync()
        {
            return await _context.ChatMessages
                .OrderByDescending(m => m.CreateDate)
                .ToListAsync();
        }

        public async Task<List<ChatMessage>> GetByUserAndChatTypeAsync(int studentId, string chatType)
        {
            return await _context.ChatMessages
                .Where(m => m.StudentID == studentId && m.ChatType == chatType)
                .OrderBy(m => m.CreateDate)
                .ToListAsync();
        }

        public async Task UpdateAsync(ChatMessage message)
        {
            _context.ChatMessages.Update(message);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var message = await _context.ChatMessages.FindAsync(id);
            if (message != null)
            {
                _context.ChatMessages.Remove(message);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteOldestIfExceedsLimitAsync(int studentId, string chatType, int limit = 20)
        {
            var messages = await _context.ChatMessages
                .Where(m => m.StudentID == studentId && m.ChatType == chatType)
                .OrderBy(m => m.CreateDate)
                .ToListAsync();

            while (messages.Count >= limit)
            {
                var toDelete = messages.First();
                _context.ChatMessages.Remove(toDelete);
                messages.RemoveAt(0);
            }

            await _context.SaveChangesAsync();
        }
    }
}
