import SwiftUI
import WebKit

struct LocalHTMLWebView: View {
    private var fileURL: URL? {
        Bundle.main.url(forResource: "Main", withExtension: "html")
    }

    var body: some View {
        if let url = fileURL {
            WebView(url: url)
        } else {
            Text("Missing local content.")
        }
    }
}

#if os(iOS)
struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.scrollView.isScrollEnabled = false
        load(webView)
        
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        load(uiView)
    }

    private func load(_ webView: WKWebView) {
        guard webView.url != url else { return }
        
        let baseURL = url.deletingLastPathComponent()
        webView.loadFileURL(url, allowingReadAccessTo: baseURL)
    }
}
#elseif os(macOS)
struct WebView: NSViewRepresentable {
    let url: URL

    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView()
        load(webView)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        load(nsView)
    }

    private func load(_ webView: WKWebView) {
        guard webView.url != url else { return }
        
        let baseURL = url.deletingLastPathComponent()
        webView.loadFileURL(url, allowingReadAccessTo: baseURL)
    }
}
#endif
