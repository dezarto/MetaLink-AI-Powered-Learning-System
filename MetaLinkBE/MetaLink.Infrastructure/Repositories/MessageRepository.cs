using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly AppDbContext _context;

        public MessageRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Message> AddAsync(Message message)
        {
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();
            return message;
        }

        public async Task<IEnumerable<Message>> GetMessagesAsync(int studentId, int otherStudentId)
        {
            return await _context.Messages
                .Where(m => (m.SenderStudentId == studentId && m.ReceiverStudentId == otherStudentId) ||
                            (m.SenderStudentId == otherStudentId && m.ReceiverStudentId == studentId))
                .OrderBy(m => m.SentAt)
                .ToListAsync();
        }

        public async Task<Message> GetByIdAsync(int id)
        {
            return await _context.Messages
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<Message> UpdateAsync(Message message)
        {
            _context.Messages.Update(message);
            await _context.SaveChangesAsync();
            return message;
        }

        public async Task<List<Message>> GetAll()
        {
            return await _context.Messages.ToListAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message != null)
            {
                _context.Messages.Remove(message);
                await _context.SaveChangesAsync();
            }
        }
    }
}
