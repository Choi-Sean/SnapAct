import Darwin
import Foundation

/// Resident footprint of this process, in bytes.
///
/// Exists for one decision: whether the image encoder can live inside a Share
/// Extension, which is killed silently when it exceeds its cap. A number
/// measured on the host Mac is not that answer — it is the first evidence,
/// and the real figure comes from a device with Instruments attached.
///
/// `phys_footprint` rather than `resident_size` because it is what the OS
/// actually charges against the memory limit.
public enum MemoryFootprint {
    public static func current() -> UInt64 {
        var info = task_vm_info_data_t()
        var count = mach_msg_type_number_t(MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<natural_t>.size)
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &count)
            }
        }
        return result == KERN_SUCCESS ? UInt64(info.phys_footprint) : 0
    }

    public static func formatted(_ bytes: UInt64) -> String {
        String(format: "%.1f MB", Double(bytes) / 1_048_576)
    }
}
