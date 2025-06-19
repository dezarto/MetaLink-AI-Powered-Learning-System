namespace MetaLink.Domain.Entities
{
    public class GameProgress
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int GameId { get; set; }
        public string ProgressData { get; set; } // JSON formatında oyun durumu
        public DateTime LastUpdated { get; set; }
    }
}
