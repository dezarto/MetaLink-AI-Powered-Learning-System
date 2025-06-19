using MetaLink.Domain.Entities;

namespace MetaLink.Application.Interfaces
{
    public interface IMessageAppService
    {
        Task<Message> SendMessageAsync(int senderId, int receiverId, string content);
        Task<IEnumerable<Message>> GetMessagesAsync(int studentId, int otherStudentId);
        Task<Message> MarkAsReadAsync(int messageId);
    }
}
