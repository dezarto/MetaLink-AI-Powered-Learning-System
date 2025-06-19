using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class GameInviteService : IGameInviteService
    {
        private readonly IGameInviteRepository _repository;

        public GameInviteService(IGameInviteRepository repository)
        {
            _repository = repository;
        }

        public async Task<GameInvite> SendInviteAsync(int fromStudentId, int toStudentId, int gameId)
        {
            var existing = await _repository.GetPendingInviteAsync(toStudentId);
            if (existing != null)
            {
                await _repository.CancelInviteAsync(existing.Id);
            }

            var invite = new GameInvite
            {
                FromStudentId = fromStudentId,
                ToStudentId = toStudentId,
                GameId = gameId,
                CreatedAt = DateTime.UtcNow,
                IsAccepted = false,
                IsCancelled = false
            };

            await _repository.AddInviteAsync(invite);

            return invite;
        }

        public async Task<GameInvite> AcceptInviteAsync(int inviteId)
        {
           return await _repository.AcceptInviteAsync(inviteId);
        }

        public async Task<GameInvite> CancelInviteAsync(int inviteId)
        {
            return await _repository.CancelInviteAsync(inviteId);
        }

        public async Task<GameInvite?> GetPendingInviteAsync(int toStudentId)
        {
            return await _repository.GetPendingInviteAsync(toStudentId);
        }

        public async Task<GameInvite?> CheckInviteAsync(int toStudentId)
        {
            return await _repository.GetPendingInviteAsync(toStudentId);
        }

        public async Task<GameInvite?> GetInviteByIdAsync(int inviteId)
        {
            return await _repository.GetInviteByIdAsync(inviteId);
        }

        public async Task<List<GameInvite>> GetAllInvite()
        {
            return await _repository.GetAllInvite();
        }

        public async Task DeleteInvite(int inviteId)
        {
            await _repository.DeleteInvite(inviteId);
        }
    }
}
