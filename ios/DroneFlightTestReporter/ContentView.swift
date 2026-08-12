import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @State private var report = Report()
    @State private var selectedFlight = 0
    @State private var showingImporter = false
    @State private var showingExporter = false
    @State private var exportDocument = ReportDocument(report: Report())
    @State private var importError = ""
    @State private var showingError = false

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
                        Button {
                            selectedFlight = index
                        } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text("Flight \(String(format: "%02d", report.flights[index].number))")
                                        .font(.headline)
                                    Text(report.flights[index].missionID.isEmpty ? "No mission ID" : report.flights[index].missionID)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(report.flights[index].result.rawValue)
                                    .font(.caption)
                                    .foregroundStyle(report.flights[index].result == .fail ? .red : .secondary)
                            }
                        }
                        .foregroundStyle(.primary)
                    }
                    Button("+ Add Flight") {
                        report.flights.append(Flight(number: report.flights.count + 1))
                        selectedFlight = report.flights.count - 1
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
                    FlightEditor(flight: $report.flights[selectedFlight], showingImporter: $showingImporter)
                }

                Section("Report") {
                    HStack {
                        Text("Overall Result")
                        Spacer()
                        Text(report.overallResult.rawValue).bold()
                    }
                    Button("Generate & Preview Report") { }
                    Button("Export JSON") {
                        exportDocument = ReportDocument(report: report)
                        showingExporter = true
                    }
                    ShareLink(item: reportMarkdown) {
                        Label("Share Markdown Report", systemImage: "square.and.arrow.up")
                    }
                }
            }
            .navigationTitle("Flight Test Reporter")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("New") { report = Report(); selectedFlight = 0 }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingImporter = true } label: { Image(systemName: "folder") }
                }
            }
            .fileImporter(isPresented: $showingImporter, allowedContentTypes: [.item], allowsMultipleSelection: true) { result in
                switch result {
                case .success(let urls):
                    guard report.flights.indices.contains(selectedFlight) else { return }
                    report.flights[selectedFlight].attachments.append(contentsOf: urls.map(\.path))
                case .failure(let error):
                    importError = error.localizedDescription
                    showingError = true
                }
            }
            .fileExporter(isPresented: $showingExporter, document: exportDocument, contentType: .json, defaultFilename: "flight-test-report.json") { _ in }
            .alert("Import Error", isPresented: $showingError) { Button("OK", role: .cancel) {} } message: { Text(importError) }
        }
    }

    private var reportMarkdown: String {
        var output = "# Drone Flight Test Report — \(report.testID.isEmpty ? "Untitled" : report.testID)\n\n"
        output += "**Project / Customer:** \(report.project.isEmpty ? "N/A" : report.project)\n"
        output += "**Overall Result:** \(report.overallResult.rawValue)\n"
        output += "**Location:** \(report.location.isEmpty ? "N/A" : report.location)\n"
        output += "**Operator:** \(report.operatorName.isEmpty ? "N/A" : report.operatorName)\n\n"
        output += "## Test Objective\n\n\(report.objective.isEmpty ? "N/A" : report.objective)\n\n"
        output += "## Aircraft & Configuration\n\n"
        output += "- UAV Category: \(report.uavCategory.isEmpty ? "N/A" : report.uavCategory)\n"
        output += "- Aircraft / Model: \(report.aircraftModel.isEmpty ? "N/A" : report.aircraftModel)\n"
        output += "- Serial Number: \(report.serialNumber.isEmpty ? "N/A" : report.serialNumber)\n"
        output += "- Flight Controller: \(report.flightController.isEmpty ? "N/A" : report.flightController)\n"
        output += "- Ground Control: \(report.groundControl.isEmpty ? "N/A" : report.groundControl)\n"
        output += "- Firmware: \(report.firmware.isEmpty ? "N/A" : report.firmware)\n\n"
        for flight in report.flights {
            output += "## Flight \(String(format: "%02d", flight.number)) — \(flight.result.rawValue)\n\n"
            output += "**Date / Time:** \(flight.dateTime.formatted())  \n"
            output += "**Mission ID:** \(flight.missionID.isEmpty ? "N/A" : flight.missionID)  \n"
            output += "**Battery:** \(flight.batteryID.isEmpty ? "N/A" : flight.batteryID)  \n"
            output += "**Duration:** \(flight.duration.isEmpty ? "N/A" : flight.duration)  \n"
            output += "**Flight Modes:** \(flight.flightModes.isEmpty ? "N/A" : flight.flightModes)\n\n"
            output += "### Mission\n\n\(flight.missionPerformed.isEmpty ? "N/A" : flight.missionPerformed)\n\n"
            output += "### Telemetry\n\n\(flight.telemetrySummary.isEmpty ? "N/A" : flight.telemetrySummary)\n\n"
            output += "### Anomaly / Bug\n\n\(flight.anomalies.isEmpty ? "None reported" : flight.anomalies)\n\n"
            output += "### Expected Behaviour\n\n\(flight.expectedBehaviour.isEmpty ? "N/A" : flight.expectedBehaviour)\n\n"
            output += "### Immediate Action\n\n\(flight.immediateAction.isEmpty ? "None" : flight.immediateAction)\n\n"
            output += "### Findings\n\n\(flight.findings.isEmpty ? "N/A" : flight.findings)\n\n"
            output += "### Operator Timeline\n\n\(flight.operatorNotes.isEmpty ? "No timeline entries." : flight.operatorNotes)\n\n"
            if !flight.attachments.isEmpty { output += "### Evidence\n\n" + flight.attachments.map { "- \($0)" }.joined(separator: "\n") + "\n\n" }
        }
        output += "## Conclusion\n\nOverall test result: **\(report.overallResult.rawValue)**.\n"
        return output
    }
}

struct FlightEditor: View {
    @Binding var flight: Flight
    @Binding var showingImporter: Bool

    var body: some View {
        Section("Flight \(String(format: "%02d", flight.number))") {
            DatePicker("Flight Date & Time", selection: $flight.dateTime)
            Picker("Result", selection: $flight.result) {
                ForEach(FlightResult.allCases, id: \.self) { Text($0.rawValue).tag($0) }
            }
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
            TextField("Flight Log Path", text: $flight.flightLogPath)
            TextField("Wireshark Capture Path", text: $flight.captureFilePath)
            Button("Add Evidence / Attachments") { showingImporter = true }
            if !flight.attachments.isEmpty {
                ForEach(flight.attachments, id: \.self) { Text($0).font(.caption) }
            }
        }
    }
}

struct ReportDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var report: Report

    init(report: Report) { self.report = report }
    init(configuration: ReadConfiguration) throws {
        report = try JSONDecoder().decode(Report.self, from: configuration.file.regularFileContents ?? Data())
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        let data = try JSONEncoder.pretty.encode(report)
        return FileWrapper(regularFileWithContents: data)
    }
}

extension JSONEncoder {
    static var pretty: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}
