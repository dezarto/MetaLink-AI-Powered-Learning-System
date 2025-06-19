using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IStudentReportService
    {
        Task<StudentReport?> GetStudentReportByIdAsync(int id);
        Task<List<StudentReport>> GetStudentReportByStudentIdAsync(int studentId);
        Task<List<StudentReport>> GetStudentReportAllAsync();
        Task AddStudentReportAsync(StudentReport report);
        Task UpdateStudentReportAsync(StudentReport report);
        Task DeleteStudentReportAsync(int id);
    }
}
