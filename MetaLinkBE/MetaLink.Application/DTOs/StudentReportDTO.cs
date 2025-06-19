namespace MetaLink.Application.DTOs
{
    public class StudentReportDTO
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string ReportText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
    }
}
