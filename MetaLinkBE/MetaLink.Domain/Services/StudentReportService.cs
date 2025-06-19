using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class StudentReportService : IStudentReportService
    {
        private readonly IStudentReportRepository _studentReportRepository;

        public StudentReportService(IStudentReportRepository studentReportRepository)
        {
            _studentReportRepository = studentReportRepository;
        }

        public async Task AddStudentReportAsync(StudentReport report)
        {
            await _studentReportRepository.AddAsync(report);
        }

        public async Task DeleteStudentReportAsync(int id)
        {
            await _studentReportRepository.DeleteAsync(id);
        }

        public async Task<List<StudentReport>> GetStudentReportAllAsync()
        {
            return await _studentReportRepository.GetAllAsync();
        }

        public async Task<StudentReport?> GetStudentReportByIdAsync(int id)
        {
            return await _studentReportRepository.GetByIdAsync(id);
        }

        public async Task<List<StudentReport>> GetStudentReportByStudentIdAsync(int studentId)
        {
            return await _studentReportRepository.GetByStudentIdAsync(studentId);
        }

        public async Task UpdateStudentReportAsync(StudentReport report)
        {
            await _studentReportRepository.UpdateAsync(report);
        }
    }
}
