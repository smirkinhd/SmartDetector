using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.RegularExpressions;


namespace BackendGermanSmartDetector.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<ImportController> _logger;
        private string modelPath;
        private string outputCsvPath;
        private string videoPath;
        private string jsonPath;
        private string outputVideoPath;
        private string outputConvertVideo;
        public ImportController(IConfiguration configuration, IWebHostEnvironment env, ILogger<ImportController> logger)
        {
            _configuration = configuration;
            _env = env;
            _logger = logger;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] IFormFile video, [FromForm] IFormFile areas)
        {

            string tempFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp");
            _logger.LogInformation(tempFolderPath);
            if (Directory.Exists(tempFolderPath))
            {
                string[] files = Directory.GetFiles(tempFolderPath);
                _logger.LogInformation(String.Join(" ", files));
                foreach (string file in files)
                {

                    System.IO.File.Delete(file);
                }
            }

            if (video == null || areas == null)
            {
                return BadRequest("Оба файла (видео и JSON) должны быть переданы.");
            }

            string jsonContent;
            using (var stream = areas.OpenReadStream())
            using (var reader = new StreamReader(stream))
            {
                jsonContent = await reader.ReadToEndAsync();
            }
            _logger.LogInformation(jsonContent);
            int timeoutMilliseconds = 60000;

            try
            {
                jsonContent = jsonContent.Replace("\"orx\"", "\"x\"").Replace("\"ory\"", "\"y\"");
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка обработки JSON: {ex.Message}");
            }

            List<Area> formattedAreas;
            try
            {
                formattedAreas = JsonConvert.DeserializeObject<List<Area>>(jsonContent);
            }
            catch (JsonException ex)
            {
                return BadRequest($"Ошибка десериализации JSON: {ex.Message}");
            }

            videoPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp", Path.GetRandomFileName() + Path.GetExtension(video.FileName));
            jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp", Path.GetRandomFileName() + ".json");
            outputVideoPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp", Path.GetRandomFileName() + Path.GetExtension(video.FileName));
            outputCsvPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp", "Report" + ".xlsx");
            modelPath = Path.Combine(Directory.GetCurrentDirectory(), "model", "yolov10s_openvino_model");
            outputConvertVideo = Path.Combine(Directory.GetCurrentDirectory(), "Temp", Path.GetRandomFileName() + Path.GetExtension(video.FileName));

            try
            {
                using (var stream = new FileStream(videoPath, FileMode.Create))
                {
                    await video.CopyToAsync(stream);
                }
                _logger.LogInformation("Попытка записи в файл JSON");
                await System.IO.File.WriteAllTextAsync(jsonPath, jsonContent);
                _logger.LogInformation("Звершение записи в файл JSON");
                string pythonScriptPath = Path.Combine(Directory.GetCurrentDirectory(), "Python", "main.py");
                string converterScript = Path.Combine(Directory.GetCurrentDirectory(), "Python", "remux_to_h264.py");
                string arguments = $"\"{pythonScriptPath}\" --video-path \"{videoPath}\" --model-path \"{modelPath}\" --output-path \"{outputVideoPath}\" --report-path \"{outputCsvPath}\" --regions \"{jsonPath}\"";
                string argConv = $"\"{converterScript}\" \"{outputVideoPath}\" \"{outputConvertVideo}\"";

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = arguments,
                    RedirectStandardOutput = false,
                    RedirectStandardError = false,
                    UseShellExecute = false,
                    CreateNoWindow = false
                };
                _logger.LogInformation("Начало работы с python");
                using (var process = Process.Start(processStartInfo))
                {
                    //string proc = await process.StandardOutput.ReadToEndAsync();
                    //process.BeginOutputReadLine();
                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0)
                    {
                        //string error = await process.StandardOutput.ReadToEndAsync();
                        return StatusCode(500, $"Ошибка выполнения Python-скрипта:");
                    }
                }
                _logger.LogInformation("Закончили работать");
                string? excelDownloadUrl = Url.Action(nameof(DownloadExcel), new { filePath = outputCsvPath });
                excelDownloadUrl = Path.GetFileName(excelDownloadUrl);

                var converter = new ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = argConv,
                    RedirectStandardOutput = false,
                    RedirectStandardError = false,
                    UseShellExecute = false,
                    CreateNoWindow = false
                };

                using (var converterProcess = Process.Start(converter))
                {
                    //converterProcess.BeginOutputReadLine();
                    await converterProcess.WaitForExitAsync();

                    if (converterProcess.ExitCode != 0)
                    {
                        //string error = await converterProcess.StandardError.ReadToEndAsync();
                        return StatusCode(500, $"Ошибка выполнения Python-скрипта для конвертации");
                    }
                }

                string videoUrl = Url.Content($"~/Temp/{Path.GetFileName(outputConvertVideo)}");
                _logger.LogInformation("Закончили работать");
                return Ok(new
                {
                    VideoUrl = videoUrl,
                    excelUrl = excelDownloadUrl
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex);
            }

        }

        [HttpGet("download-excel")]
        public async Task<IActionResult> DownloadExcel([FromQuery] string filePath)
        {
            int index = filePath.IndexOf('?');

            if (index >= 0)
            {
                filePath = filePath.Substring(0, index);
            }

            filePath = filePath.Replace("?", "");

            if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath))
            {
                return NotFound("Файл не найден.");
            }

            byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            string fileName = Path.GetFileName(filePath);

            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        public class Area
        {
            public int AreaNumber { get; set; }
            public List<Coordinate> Coordinates { get; set; }
        }

        public class Coordinate
        {
            public double X { get; set; }
            public double Y { get; set; }
        }

        public class MultipartResponse
        {
            public string VideoUrl { get; set; }
            public string excelUrl { get; set; }
        }
    }
}