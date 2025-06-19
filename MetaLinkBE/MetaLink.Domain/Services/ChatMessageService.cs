using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class ChatMessageService : IChatMessageService
    {
        private readonly IChatMessageRepository _chatMessageRepository;

        public ChatMessageService(IChatMessageRepository chatMessageRepository)
        {
            _chatMessageRepository = chatMessageRepository;
        }

        public async Task AddChatMessageAsync(ChatMessage message)
        {
            await _chatMessageRepository.AddAsync(message);
        }

        public async Task DeleteChatMessageAsync(int id)
        {
            await _chatMessageRepository.DeleteAsync(id);
        }

        public async Task DeleteChatMessageOldestIfExceedsLimitAsync(int studentId, string chatType, int limit = 20)
        {
            await _chatMessageRepository.DeleteOldestIfExceedsLimitAsync(studentId, chatType, limit);
        }

        public async Task<List<ChatMessage>> GetAllChatMessageAsync()
        {
            return await _chatMessageRepository.GetAllAsync();
        }

        public async Task<ChatMessage?> GetChatMessageByIdAsync(int id)
        {
            return await _chatMessageRepository.GetByIdAsync(id);
        }

        public async Task<List<ChatMessage>> GetChatMessageByUserAndChatTypeAsync(int studentId, string chatType)
        {
            return await _chatMessageRepository.GetByUserAndChatTypeAsync(studentId, chatType);
        }

        public async Task UpdateChatMessageAsync(ChatMessage message)
        {
            await _chatMessageRepository.UpdateAsync(message);
        }
    }
}
