using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IGameRepository
    {
        Task<Game> GetByIdAsync(int id);
        Task<List<Game>> GetAllAsync();
        Task AddAsync(Game game);
        Task UpdateAsync(Game game);
        Task DeleteAsync(int id);
    }
}
