import SwiftUI

struct ContentView: View {
    var body: some View {
        SetupInstructionsView()
#if os(macOS)
            .frame(minWidth: 360, minHeight: 520)
#endif
    }
}
