using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IGameInviteRepository
    {
        Task AddInviteAsync(GameInvite invite);
        Task<GameInvite?> GetPendingInviteAsync(int toStudentId);
        Task<GameInvite> AcceptInviteAsync(int inviteId);
        Task<GameInvite> CancelInviteAsync(int inviteId);
        Task<GameInvite?> GetInviteByIdAsync(int inviteId);
        Task<List<GameInvite>> GetAllInvite();
        Task DeleteInvite(int inviteId);
    }
}
