using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IXPRecordRepository
    {
        Task<XPRecord> GetByIdAsync(int id);
        Task<List<XPRecord>> GetByStudentIdAsync(int studentId);
        Task AddAsync(XPRecord xpRecord);
        Task UpdateAsync(XPRecord xpRecord);
        Task DeleteAsync(int id);
    }
}
