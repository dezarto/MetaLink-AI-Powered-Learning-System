using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;

namespace MetaLink.Domain.Interfaces
{
    public interface IXPService
    {
        Task<bool> ProcessXPAsync(int studentId, int gameId, int amount, XPType xpType, string? description = null);
        Task<int> GetTotalXPAsync(int studentId, XPType type);
        Task<List<XPRecord>> GetXPRecordsAsync(int studentId);
        Task<int> GetAvailableXPAsync(int studentId);
        Task DeleteAsync(int id);
    }
}
