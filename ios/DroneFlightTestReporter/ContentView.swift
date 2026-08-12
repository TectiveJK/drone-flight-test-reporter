import SwiftUI
import UniformTypeIdentifiers
import AVFoundation
import Speech
import PhotosUI
import QuickLook

struct ContentView: View {
    @State private var report = Report()
    @State private var selectedFlight = 0
    @State private var showingFileImporter = false
    @State private var showingReportPreview = false
    @State private var showingExporter = false
    @State private var exportDocument = ReportDocument(report: Report())
    @State private var previewURL: URL?
    @State private var importError = ""
    @State private var showingError = false
    @State private var voice = VoiceRecorder()

    var body: some View {
        NavigationStack {
            Form {
                Section("Test Report") {
                    TextField("Test ID", text: $report.testID)
                    TextField("Project / Customer", text: $report.project)
                    TextField("Location", text: $report.location)
                    TextField("Operator", text: $report.operatorName)
                    TextField("Observer", text: $report.observer)
                    TextField("Test Objective", text: $report.objective, axis: .vertical)
                }
                Section("Aircraft & Configuration") {
                    Picker("UAV / Aircraft Category", selection: $report.uavCategory) {
                        Text("Select category...").tag("")
                        ForEach(uavCategories, id: \.self) { Text($0).tag($0) }
                    }
                    TextField("Specific Aircraft / Model", text: $report.aircraftModel)
                    TextField("Serial Number", text: $report.serialNumber)
                    TextField("Flight Controller / Autopilot", text: $report.flightController)
                    TextField("Ground Control Software", text: $report.groundControl)
                    TextField("Firmware", text: $report.firmware)
                    TextField("Weather / Environment", text: $report.weather, axis: .vertical)
                }
                Section("Flights") {
                    ForEach(report.flights.indices, id: \.self) { index in
                        Button { selectedFlight = index } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text("Flight \(String(format: "%02d", report.flights[index].number))").font(.headline)
                                    Text(report.flights[index].missionID.isEmpty ? "No mission ID" : report.flights[index].missionID).font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(report.flights[index].result.rawValue).font(.caption).foregroundStyle(report.flights[index].result == .fail ? .red : .secondary)
                            }
                        }.foregroundStyle(.primary)
                    }
                    Button("+ Add Flight") {
                        report.flights.append(Flight(number: report.flights.count + 1)); selectedFlight = report.flights.count - 1
                    }
                    if report.flights.count > 1 {
                        Button("Remove Current Flight", role: .destructive) {
                            report.flights.remove(at: selectedFlight)
                            for index in report.flights.indices { report.flights[index].number = index + 1 }
                            selectedFlight = min(selectedFlight, report.flights.count - 1)
                        }
                    }
                }
                if report.flights.indices.contains(selectedFlight) {
                    FlightEditor(flight: $report.flights[selectedFlight], showingFileImporter: $showingFileImporter, voice: voice)
                }
                Section("Report") {
                    HStack { Text("Overall Result"); Spacer(); Text(report.overallResult.rawValue).bold() }
                    Button("Generate & Preview PDF") { generatePDFPreview() }
                    Button("Export JSON") { exportDocument = ReportDocument(report: report); showingExporter = true }
                    ShareLink(item: reportMarkdown) { Label("Share Markdown Report", systemImage: "square.and.arrow.up") }
                    ShareLink(item: reportMarkdown, subject: Text("Drone Flight Test Report")) { Label("Share Report", systemImage: "paperplane") }
                }
            }
            .navigationTitle("Flight Test Reporter")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("New") { report = Report(); selectedFlight = 0 } }
                ToolbarItem(placement: .topBarTrailing) { Button { showingFileImporter = true } label: { Image(systemName: "folder") } }
            }
            .fileImporter(isPresented: $showingFileImporter, allowedContentTypes: [.json, .item], allowsMultipleSelection: true) { result in
                handleFiles(result)
            }
            .fileExporter(isPresented: $showingExporter, document: exportDocument, contentType: .json, defaultFilename: "flight-test-report.json") { _ in }
            .sheet(isPresented: $showingReportPreview) {
                if let previewURL { QuickLookPreview(url: previewURL) }
            }
            .alert("Error", isPresented: $showingError) { Button("OK", role: .cancel) {} } message: { Text(importError) }
            .onAppear { voice.requestPermissions() }
        }
    }

    private func handleFiles(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            for url in urls {
                if url.pathExtension.lowercased() == "json" {
                    do {
                        let data = try Data(contentsOf: url)
                        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
                        report = try decoder.decode(Report.self, from: data)
                        selectedFlight = 0
                    } catch {
                        importError = "Could not import report: \(error.localizedDescription)"; showingError = true
                    }
                } else if report.flights.indices.contains(selectedFlight) {
                    report.flights[selectedFlight].attachments.append(url.path)
                }
            }
        case .failure(let error):
            importError = error.localizedDescription; showingError = true
        }
    }

    private func generatePDFPreview() {
        do {
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(report.testID.isEmpty ? "flight-test-report" : report.testID).pdf")
            try PDFReportGenerator.write(report: report, to: url)
            previewURL = url; showingReportPreview = true
        } catch {
            importError = "Could not generate PDF: \(error.localizedDescription)"; showingError = true
        }
    }

    private var reportMarkdown: String {
        var output = "# Drone Flight Test Report — \(report.testID.isEmpty ? "Untitled" : report.testID)\n\n"
        output += "**Project / Customer:** \(report.project.isEmpty ? "N/A" : report.project)\n**Overall Result:** \(report.overallResult.rawValue)\n**Location:** \(report.location.isEmpty ? "N/A" : report.location)\n**Operator:** \(report.operatorName.isEmpty ? "N/A" : report.operatorName)\n\n"
        output += "## Test Objective\n\n\(report.objective.isEmpty ? "N/A" : report.objective)\n\n## Aircraft & Configuration\n\n"
        output += "- UAV Category: \(report.uavCategory.isEmpty ? "N/A" : report.uavCategory)\n- Aircraft / Model: \(report.aircraftModel.isEmpty ? "N/A" : report.aircraftModel)\n- Serial Number: \(report.serialNumber.isEmpty ? "N/A" : report.serialNumber)\n- Flight Controller: \(report.flightController.isEmpty ? "N/A" : report.flightController)\n- Ground Control: \(report.groundControl.isEmpty ? "N/A" : report.groundControl)\n- Firmware: \(report.firmware.isEmpty ? "N/A" : report.firmware)\n\n"
        for flight in report.flights {
            output += "## Flight \(String(format: "%02d", flight.number)) — \(flight.result.rawValue)\n\n"
            output += "**Date / Time:** \(flight.dateTime.formatted())  \n**Mission ID:** \(flight.missionID.isEmpty ? "N/A" : flight.missionID)  \n**Battery:** \(flight.batteryID.isEmpty ? "N/A" : flight.batteryID)  \n**Duration:** \(flight.duration.isEmpty ? "N/A" : flight.duration)  \n**Flight Modes:** \(flight.flightModes.isEmpty ? "N/A" : flight.flightModes)\n\n"
            output += "### Mission\n\n\(flight.missionPerformed.isEmpty ? "N/A" : flight.missionPerformed)\n\n### Telemetry\n\n\(flight.telemetrySummary.isEmpty ? "N/A" : flight.telemetrySummary)\n\n### Anomaly / Bug\n\n\(flight.anomalies.isEmpty ? "None reported" : flight.anomalies)\n\n### Expected Behaviour\n\n\(flight.expectedBehaviour.isEmpty ? "N/A" : flight.expectedBehaviour)\n\n### Immediate Action\n\n\(flight.immediateAction.isEmpty ? "None" : flight.immediateAction)\n\n### Findings\n\n\(flight.findings.isEmpty ? "N/A" : flight.findings)\n\n### Operator Timeline\n\n\(flight.operatorNotes.isEmpty ? "No timeline entries." : flight.operatorNotes)\n\n"
            if !flight.attachments.isEmpty { output += "### Evidence\n\n" + flight.attachments.map { "- \($0)" }.joined(separator: "\n") + "\n\n" }
        }
        return output + "## Conclusion\n\nOverall test result: **\(report.overallResult.rawValue)**.\n"
    }
}

struct FlightEditor: View {
    @Binding var flight: Flight
    @Binding var showingFileImporter: Bool
    let voice: VoiceRecorder
    @State private var isRecording = false

    var body: some View {
        Section("Flight \(String(format: "%02d", flight.number))") {
            DatePicker("Flight Date & Time", selection: $flight.dateTime)
            Picker("Result", selection: $flight.result) { ForEach(FlightResult.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
            TextField("Battery ID", text: $flight.batteryID)
            TextField("Mission ID", text: $flight.missionID)
            TextField("Flight Duration", text: $flight.duration)
            TextField("Flight Modes", text: $flight.flightModes)
            TextField("Mission Performed", text: $flight.missionPerformed, axis: .vertical)
            TextField("Telemetry Summary", text: $flight.telemetrySummary, axis: .vertical)
            TextField("Anomalies / Bugs", text: $flight.anomalies, axis: .vertical)
            TextField("Expected Behaviour", text: $flight.expectedBehaviour, axis: .vertical)
            TextField("Immediate Action", text: $flight.immediateAction, axis: .vertical)
            TextField("Result / Findings", text: $flight.findings, axis: .vertical)
            TextField("Operator Notes / Timeline", text: $flight.operatorNotes, axis: .vertical)
            HStack {
                Button(isRecording ? "Stop Voice Note" : "Start Voice Note") {
                    if isRecording { voice.stop(); isRecording = false }
                    else { voice.start { text in flight.operatorNotes += (flight.operatorNotes.isEmpty ? "" : "\n") + "\(Date().formatted(date: .omitted, time: .shortened)) — \(text)" }; isRecording = true }
                }
                if isRecording { Image(systemName: "mic.fill").foregroundStyle(.red) }
            }
            TextField("Flight Log Path", text: $flight.flightLogPath)
            TextField("Wireshark Capture Path", text: $flight.captureFilePath)
            Button("Add Evidence / Attachments") { showingFileImporter = true }
            ForEach(flight.attachments, id: \.self) { Text($0).font(.caption) }
        }
    }
}

final class VoiceRecorder: NSObject, ObservableObject {
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var handler: ((String) -> Void)?
    func requestPermissions() {
        SFSpeechRecognizer.requestAuthorization { _ in }
        AVAudioSession.sharedInstance().requestRecordPermission { _ in }
    }
    func start(handler: @escaping (String) -> Void) {
        self.handler = handler
        task?.cancel(); task = nil
        request = SFSpeechAudioBufferRecognitionRequest()
        guard let request, let recognizer, recognizer.isAvailable else { return }
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.record, mode: .measurement, options: .duckOthers)
        try? session.setActive(true, options: .notifyOthersOnDeactivation)
        let input = audioEngine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in request.append(buffer) }
        task = recognizer.recognitionTask(with: request) { [weak self] result, _ in
            guard let self, let result, result.isFinal else { return }
            self.handler?(result.bestTranscription.formattedString)
        }
        audioEngine.prepare(); try? audioEngine.start()
    }
    func stop() {
        audioEngine.stop(); audioEngine.inputNode.removeTap(onBus: 0); request?.endAudio(); task?.cancel(); task = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}

struct PDFReportGenerator {
    static func write(report: Report, to url: URL) throws {
        let page = CGRect(x: 0, y: 0, width: 595, height: 842)
        let renderer = UIGraphicsPDFRenderer(bounds: page)
        try renderer.writePDF(to: url) { context in
            context.beginPage(); var y: CGFloat = 42
            func text(_ value: String, size: CGFloat = 11, bold: Bool = false, spacing: CGFloat = 18) {
                let font = bold ? UIFont.boldSystemFont(ofSize: size) : UIFont.systemFont(ofSize: size)
                let attrs: [NSAttributedString.Key: Any] = [.font: font]
                let rect = CGRect(x: 42, y: y, width: 511, height: 1000)
                value.draw(in: rect, withAttributes: attrs); y += spacing
                if y > 790 { context.beginPage(); y = 42 }
            }
            text("Drone Flight Test Report", size: 24, bold: true, spacing: 34)
            text(report.testID.isEmpty ? "Untitled" : report.testID, size: 16, bold: true)
            text("Project / Customer: \(report.project.isEmpty ? "N/A" : report.project)")
            text("Overall Result: \(report.overallResult.rawValue)")
            text("Location: \(report.location.isEmpty ? "N/A" : report.location)")
            text("Operator: \(report.operatorName.isEmpty ? "N/A" : report.operatorName)")
            text("UAV Category: \(report.uavCategory.isEmpty ? "N/A" : report.uavCategory)")
            text("Aircraft / Model: \(report.aircraftModel.isEmpty ? "N/A" : report.aircraftModel)")
            text("Serial Number: \(report.serialNumber.isEmpty ? "N/A" : report.serialNumber)")
            text("Test Objective", size: 14, bold: true); text(report.objective.isEmpty ? "N/A" : report.objective, spacing: 24)
            for flight in report.flights {
                text("Flight \(String(format: "%02d", flight.number)) — \(flight.result.rawValue)", size: 16, bold: true, spacing: 26)
                text("Date / Time: \(flight.dateTime.formatted())")
                text("Mission ID: \(flight.missionID.isEmpty ? "N/A" : flight.missionID)")
                text("Battery: \(flight.batteryID.isEmpty ? "N/A" : flight.batteryID)")
                text("Flight Modes: \(flight.flightModes.isEmpty ? "N/A" : flight.flightModes)")
                text("Mission", size: 13, bold: true); text(flight.missionPerformed.isEmpty ? "N/A" : flight.missionPerformed, spacing: 24)
                text("Telemetry", size: 13, bold: true); text(flight.telemetrySummary.isEmpty ? "N/A" : flight.telemetrySummary, spacing: 24)
                text("Anomaly / Bug", size: 13, bold: true); text(flight.anomalies.isEmpty ? "None reported" : flight.anomalies, spacing: 24)
                text("Expected Behaviour", size: 13, bold: true); text(flight.expectedBehaviour.isEmpty ? "N/A" : flight.expectedBehaviour, spacing: 24)
                text("Immediate Action", size: 13, bold: true); text(flight.immediateAction.isEmpty ? "None" : flight.immediateAction, spacing: 24)
                text("Findings", size: 13, bold: true); text(flight.findings.isEmpty ? "N/A" : flight.findings, spacing: 24)
                text("Operator Timeline", size: 13, bold: true); text(flight.operatorNotes.isEmpty ? "None" : flight.operatorNotes, spacing: 24)
            }
            text("Conclusion", size: 14, bold: true); text("Overall test result: \(report.overallResult.rawValue).", spacing: 24)
        }
    }
}

struct QuickLookPreview: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> QLPreviewController { let c = QLPreviewController(); c.dataSource = context.coordinator; return c }
    func updateUIViewController(_ controller: QLPreviewController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(url: url) }
    final class Coordinator: NSObject, QLPreviewControllerDataSource {
        let url: URL; init(url: URL) { self.url = url }
        func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }
        func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { url as NSURL }
    }
}

struct ReportDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var report: Report
    init(report: Report) { self.report = report }
    init(configuration: ReadConfiguration) throws {
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        report = try decoder.decode(Report.self, from: configuration.file.regularFileContents ?? Data())
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys]; encoder.dateEncodingStrategy = .iso8601
        return FileWrapper(regularFileWithContents: try encoder.encode(report))
    }
}
