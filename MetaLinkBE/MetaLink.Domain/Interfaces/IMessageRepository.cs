using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IMessageRepository
    {
        Task<List<Message>> GetAll();
        Task<Message> AddAsync(Message message);
        Task<IEnumerable<Message>> GetMessagesAsync(int studentId, int otherStudentId);
        Task<Message> GetByIdAsync(int id);
        Task<Message> UpdateAsync(Message message);
        Task DeleteAsync(int id);
    }
}
