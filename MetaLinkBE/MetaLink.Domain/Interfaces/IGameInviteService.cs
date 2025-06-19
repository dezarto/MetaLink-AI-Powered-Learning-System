using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IGameInviteService
    {
        Task<GameInvite> SendInviteAsync(int fromStudentId, int toStudentId, int gameId);
        Task<GameInvite?> CheckInviteAsync(int toStudentId);
        Task<GameInvite> AcceptInviteAsync(int inviteId);
        Task<GameInvite> CancelInviteAsync(int inviteId);
        Task<GameInvite?> GetInviteByIdAsync(int inviteId);
        Task<List<GameInvite>> GetAllInvite();
        Task DeleteInvite(int inviteId);
    }
}
