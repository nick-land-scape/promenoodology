import UIKit
import Social
import UniformTypeIdentifiers

/**
 * "Share to promeNOOD", from anywhere on the phone.
 *
 * The point of this is the archive. A hundred and sixty-two photographs of five
 * years exist because somebody sat down afterwards and uploaded them; the ones
 * taken on the night, on somebody's phone, mostly do not — because posting them
 * meant opening the app, finding the composer and choosing files out of a
 * library of four thousand. From the share sheet it is two taps at the moment
 * the picture is still the thing being looked at.
 *
 * How it gets there, and why it is not simpler: an app extension is its own
 * process with its own container and no access to the member's session in the
 * app's web view. So it does not upload. It writes the pictures into the App
 * Group both targets can see, and the app — which does know who you are —
 * finds them the next time it comes forward and hands them to the composer.
 * Nothing here needs a key, and nothing leaves the phone until somebody presses
 * post.
 *
 * Deliberately no UI of its own beyond the system sheet. A second composer,
 * living in an extension, with its own idea of what a post is, is a second thing
 * to keep in step with the first — and this one cannot even see who you are.
 */
class ShareViewController: SLComposeServiceViewController {

    /// The container both the app and this extension can write to.
    private static let group = "group.com.promenoodology.community"

    override func isContentValid() -> Bool { true }

    override func presentationAnimationDidFinish() {
        super.presentationAnimationDidFinish()
        // The sheet is only ever a confirmation, so it says what will happen.
        placeholder = "Anything you want to say with it"
    }

    override func didSelectPost() {
        let items = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
        let attachments = items.flatMap { $0.attachments ?? [] }
        let note = contentText ?? ""

        let waiting = DispatchGroup()
        var written: [String] = []

        for provider in attachments {
            guard provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) else { continue }
            waiting.enter()
            provider.loadItem(forTypeIdentifier: UTType.image.identifier) { item, _ in
                defer { waiting.leave() }
                guard let data = Self.data(from: item) else { return }
                if let name = Self.keep(data) { written.append(name) }
            }
        }

        waiting.notify(queue: .main) {
            Self.leaveNote(note, with: written)
            self.extensionContext?.completeRequest(returningItems: nil)
        }
    }

    /// Whatever the sharing app handed over, as image data.
    private static func data(from item: NSSecureCoding?) -> Data? {
        if let url = item as? URL { return try? Data(contentsOf: url) }
        if let image = item as? UIImage { return image.jpegData(compressionQuality: 0.92) }
        if let data = item as? Data { return data }
        return nil
    }

    /// One picture, in the shared container, under a name nothing else will take.
    private static func keep(_ data: Data) -> String? {
        guard let folder = folder() else { return nil }
        let name = "\(UUID().uuidString).jpg"
        do {
            try data.write(to: folder.appendingPathComponent(name))
            return name
        } catch {
            return nil
        }
    }

    /// What was shared, for the app to find. Written last, so its existence means
    /// every picture beside it is already complete on disk.
    private static func leaveNote(_ words: String, with files: [String]) {
        guard let folder = folder(), !files.isEmpty else { return }
        let note = ["words": words, "files": files] as [String: Any]
        guard let data = try? JSONSerialization.data(withJSONObject: note) else { return }
        try? data.write(to: folder.appendingPathComponent("shared.json"))
    }

    private static func folder() -> URL? {
        guard
            let box = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group)
        else { return nil }
        let folder = box.appendingPathComponent("shared", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }
}
