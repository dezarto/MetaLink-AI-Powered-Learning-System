using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _repository;

        public MessageService(IMessageRepository repository)
        {
            _repository = repository;
        }

        public async Task<Message> AddAsync(Message message)
        {
            return await _repository.AddAsync(message);
        }

        public async Task DeleteAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }

        public async Task<List<Message>> GetAllMessages()
        {
            return await _repository.GetAll();
        }

        public async Task<Message> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Message>> GetMessagesAsync(int studentId, int otherStudentId)
        {
            return await _repository.GetMessagesAsync(studentId, otherStudentId);
        }

        public async Task<Message> UpdateAsync(Message message)
        {
            return await _repository.UpdateAsync(message);
        }
    }
}
