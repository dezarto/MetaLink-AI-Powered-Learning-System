using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IStudentReportRepository
    {
        Task<StudentReport?> GetByIdAsync(int id);
        Task<List<StudentReport>> GetByStudentIdAsync(int studentId);
        Task<List<StudentReport>> GetAllAsync();
        Task AddAsync(StudentReport report);
        Task UpdateAsync(StudentReport report);
        Task DeleteAsync(int id);
    }
}
