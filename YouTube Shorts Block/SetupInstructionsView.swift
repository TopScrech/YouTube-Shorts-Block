import ScrechKit

struct SetupInstructionsView: View {
    private let steps = [
        "Open Settings > Safari > Extensions",
        "Tap Focus mode for YouTube and turn on \"Allow Extension\"",
        "Open Safari, go to YouTube, then tap the AA button > Extensions > Focus mode for YouTube and allow it for this website"
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Image(.largeIcon)
                    .resizable()
                    .scaledToFit()
                    .frame(96)
                    .clipShape(.rect(cornerRadius: 16))
                    .accessibilityLabel("Focus mode for YouTube icon")
                
                VStack(spacing: 8) {
                    Text("Focus mode for YouTube")
                        .title()
                    
                    Text("Enable the Safari extension:")
                        .secondary()
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                        HStack(alignment: .top, spacing: 12) {
                            Text(index + 1)
                                .headline()
                                .frame(minWidth: 22, alignment: .trailing)
                            
                            Text(step)
                                .secondary()
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
                .padding(16)
                .background(cardBackground)
                
                Text("You can also toggle blocking from the Safari extension button")
                    .secondary()
            }
            .padding(24)
            .frame(maxWidth: 520)
            .frame(maxWidth: .infinity)
        }
    }
    
    @ViewBuilder
    private var cardBackground: some View {
        let shape = RoundedRectangle(cornerRadius: 16)
        
        if #available(macOS 12, *) {
            shape.fill(.thinMaterial)
        } else {
            shape.fill(Color.secondary.opacity(0.12))
        }
    }
}
