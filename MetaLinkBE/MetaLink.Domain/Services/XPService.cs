using Metalink.Domain.Interfaces;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class XPService : IXPService
    {
        private readonly IXPRecordRepository _xpRecordRepository;
        private readonly IStudentRepository _studentRepository;

        public XPService(IXPRecordRepository xpRecordRepository, IStudentRepository studentRepository)
        {
            _xpRecordRepository = xpRecordRepository;
            _studentRepository = studentRepository;
        }

        public async Task<bool> ProcessXPAsync(int studentId, int gameId, int amount, XPType xpType, string? description = null)
        {
            if (xpType == XPType.SpendXP)
            {
                int availableXP = await GetAvailableXPAsync(studentId);
                if (availableXP < amount)
                    return false;
            }

            var xpRecord = new XPRecord
            {
                StudentId = studentId,
                GameId = gameId,
                XPAmount = amount,
                XPStatus = xpType,
                EarnedAt = DateTime.UtcNow,
                Description = description,
            };

            await _xpRecordRepository.AddAsync(xpRecord);

            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student != null)
            {
                student.UpdateDate = DateTime.UtcNow;

                if (xpType == XPType.EarnXP)
                {
                    int newXP = await GetTotalXPAsync(studentId, XPType.EarnXP) + amount;
                    int newLevel = newXP / 100;
                    if (newLevel > 0 && student.GameLevel != newLevel)
                    {
                        student.GameLevel = newLevel;
                    }
                }

                await _studentRepository.UpdateAsync(student);
                await _studentRepository.SaveChangesAsync();
            }

            return true;
        }

        public async Task<int> GetTotalXPAsync(int studentId, XPType type)
        {
            var records = await _xpRecordRepository.GetByStudentIdAsync(studentId);
            return records
                .Where(x => x.XPStatus == type)
                .Sum(x => x.XPAmount);
        }

        public async Task<List<XPRecord>> GetXPRecordsAsync(int studentId)
        {
            return await _xpRecordRepository.GetByStudentIdAsync(studentId);
        }

        public async Task<int> GetAvailableXPAsync(int studentId)
        {
            int earned = await GetTotalXPAsync(studentId, XPType.EarnXP);
            int spent = await GetTotalXPAsync(studentId, XPType.SpendXP);
            return earned - spent;
        }

        public async Task DeleteAsync(int id)
        {
            await _xpRecordRepository.DeleteAsync(id);
        }
    }
}
