'use client'

import { useAuth } from '@/contexts/AuthContext'
import PartnerInvitation from '@/components/PartnerInvitation'
import { PartnerInfo } from '@/components/PartnerInfo'
import { RealtimeTestPanel } from '@/components/RealtimeTestPanel'
import { AddChoreForm } from '@/components/AddChoreForm'
import { ChoreList } from '@/components/ChoreList'
import { useChores } from '@/hooks/useChores'
import { usePartner } from '@/hooks/usePartner'
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection'

export default function ChoresList() {
  const { user } = useAuth()
  const { hasPartner, partnerInfo, handlePartnerLinked, unlinkPartner } = usePartner()
  const { chores, loading, addChore, toggleChore, deleteChore } = useChores()
  const { isConnected, connectionStatus, testRealtimeConnection, stopRealtimeConnection } = useRealtimeConnection()



  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">家事を読み込み中...</div>
      </div>
    )
  }


  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">家事一覧</h2>
      
      <RealtimeTestPanel 
         isConnected={isConnected}
         connectionStatus={connectionStatus}
         onTestConnection={testRealtimeConnection}
         onStopConnection={stopRealtimeConnection}
       />
       
       <PartnerInfo 
          hasPartner={hasPartner}
          partnerInfo={partnerInfo}
          onUnlinkPartner={async () => { await unlinkPartner(); }}
        />
       
       {hasPartner === false && (
         <PartnerInvitation onPartnerLinked={handlePartnerLinked} />
       )}
       
       <AddChoreForm onAddChore={async (title) => { await addChore(title); }} isLoading={loading} />
 
       <ChoreList 
         chores={chores}
         isLoading={loading}
         onToggleChore={toggleChore}
         onDeleteChore={deleteChore}
       />
    </div>
  )
}