using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IGameProgressRepository
    {
        Task<GameProgress> GetByIdAsync(int id);
        Task<GameProgress> GetByStudentAndGameAsync(int studentId, int gameId);
        Task<List<GameProgress>> GetByStudentIdAsync(int studentId);
        Task AddAsync(GameProgress gameProgress);
        Task UpdateAsync(GameProgress gameProgress);
        Task DeleteAsync(int id);
    }
}
